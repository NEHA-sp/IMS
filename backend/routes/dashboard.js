const express = require('express');
const pool = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Admin Dashboard Stats
router.get('/admin', roleMiddleware(['admin']), async (req, res) => {
  try {
    const totalInterns = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      ['intern']
    );

    const activeTasks = await pool.query(
      "SELECT COUNT(*) as count FROM tasks WHERE status IN ('pending', 'in_progress')"
    );

    const pendingReviews = await pool.query(
      "SELECT COUNT(*) as count FROM daily_reports WHERE status = 'pending'"
    );

    const criticalBlockers = await pool.query(
      "SELECT COUNT(*) as count FROM blockers WHERE status = 'open' AND severity IN ('critical', 'high')"
    );

    const weeklyCompletionResult = await pool.query(
      `SELECT EXTRACT(DOW FROM created_at) as day, COUNT(*) as count 
       FROM daily_reports 
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY EXTRACT(DOW FROM created_at)
       ORDER BY day`
    );

    // Dynamic mapping to day names or format for chart
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const completionMap = {};
    weeklyCompletionResult.rows.forEach(r => {
      completionMap[days[parseInt(r.day)]] = parseInt(r.count);
    });
    const weeklyCompletion = days.map(d => ({ day: d, count: completionMap[d] || 0 }));

    // Recent activities (mix of new reports, resolved blockers, task updates)
    const recentActivity = await pool.query(
      `(SELECT 'report' as type, u.name || ' submitted daily report' as message, dr.created_at 
        FROM daily_reports dr JOIN users u ON dr.intern_id = u.id ORDER BY dr.created_at DESC LIMIT 3)
       UNION ALL
       (SELECT 'blocker' as type, u.name || ' reported a blocker: ' || b.description as message, b.created_at 
        FROM blockers b JOIN users u ON b.intern_id = u.id ORDER BY b.created_at DESC LIMIT 3)
       UNION ALL
       (SELECT 'task' as type, 'New task proposed: ' || t.title as message, t.created_at 
        FROM tasks t ORDER BY t.created_at DESC LIMIT 3)
       ORDER BY created_at DESC LIMIT 6`
    );

    res.json({
      totalInterns: parseInt(totalInterns.rows[0].count),
      activeTasks: parseInt(activeTasks.rows[0].count),
      pendingReviews: parseInt(pendingReviews.rows[0].count),
      criticalBlockers: parseInt(criticalBlockers.rows[0].count),
      weeklyCompletion,
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mentor Dashboard Stats
router.get('/mentor', roleMiddleware(['mentor']), async (req, res) => {
  try {
    const assignedInterns = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1 AND mentor_id = $2',
      ['intern', req.user.id]
    );

    const pendingReviewsCount = await pool.query(
      `SELECT COUNT(*) as count FROM daily_reports dr 
       JOIN users u ON dr.intern_id = u.id 
       WHERE u.mentor_id = $1 AND dr.status = 'pending'`,
      [req.user.id]
    );

    const blockedTasksCount = await pool.query(
      `SELECT COUNT(*) as count FROM blockers b 
       JOIN users u ON b.intern_id = u.id 
       WHERE u.mentor_id = $1 AND b.status = 'open'`,
      [req.user.id]
    );

    // List of reports awaiting approval
    const pendingApprovals = await pool.query(
      `SELECT dr.*, u.name as intern_name, t.title as task_title 
       FROM daily_reports dr
       JOIN users u ON dr.intern_id = u.id
       LEFT JOIN tasks t ON dr.task_id = t.id
       WHERE u.mentor_id = $1 AND dr.status = 'pending'
       ORDER BY dr.report_date DESC LIMIT 5`,
      [req.user.id]
    );

    // List of active/escalated blockers with AI recommendation state
    const blockers = await pool.query(
      `SELECT b.*, u.name as intern_name, t.title as task_title,
              ais.id as ai_suggestion_id, ais.confidence as ai_confidence, ais.feedback as ai_feedback, ais.escalated as ai_escalated
       FROM blockers b
       JOIN users u ON b.intern_id = u.id
       LEFT JOIN tasks t ON b.task_id = t.id
       LEFT JOIN ai_suggestions ais ON ais.blocker_id = b.id
       WHERE u.mentor_id = $1 AND b.status = 'open'
       ORDER BY b.severity DESC, b.created_at DESC LIMIT 5`,
      [req.user.id]
    );

    res.json({
      assignedInterns: parseInt(assignedInterns.rows[0].count),
      pendingReviews: parseInt(pendingReviewsCount.rows[0].count),
      blockedTasks: parseInt(blockedTasksCount.rows[0].count),
      pendingApprovals: pendingApprovals.rows,
      blockers: blockers.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Intern Dashboard Stats
router.get('/intern', roleMiddleware(['intern']), async (req, res) => {
  try {
    // List of today's tasks
    const todaysTasks = await pool.query(
      `SELECT t.*, ta.status as assignment_status 
       FROM task_assignments ta 
       JOIN tasks t ON ta.task_id = t.id
       WHERE ta.assigned_to = $1 AND ta.status IN ('pending', 'in_progress')
       ORDER BY t.priority DESC, t.deadline ASC LIMIT 5`,
      [req.user.id]
    );

    const weeklyProgress = await pool.query(
      `SELECT COALESCE(AVG(completion_percentage), 0) as progress 
       FROM daily_reports 
       WHERE intern_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'`,
      [req.user.id]
    );

    const totalHours = await pool.query(
      `SELECT COALESCE(SUM(hours_worked), 0) as total 
       FROM daily_reports 
       WHERE intern_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'`,
      [req.user.id]
    );

    const latestFeedback = await pool.query(
      `SELECT c.comment, u.name as mentor_name, c.created_at 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.report_id IN (
         SELECT id FROM daily_reports WHERE intern_id = $1
       )
       ORDER BY c.created_at DESC LIMIT 1`,
      [req.user.id]
    );

    // Get report streak
    const streakResult = await pool.query(
      'SELECT current_streak, longest_streak FROM report_streaks WHERE intern_id = $1',
      [req.user.id]
    );
    
    const streak = streakResult.rows[0] || { current_streak: 0, longest_streak: 0 };

    res.json({
      todaysTasks: todaysTasks.rows,
      weeklyProgress: Math.round(parseFloat(weeklyProgress.rows[0].progress)),
      totalHours: parseFloat(totalHours.rows[0].total),
      latestFeedback: latestFeedback.rows[0] || null,
      reportStreak: streak
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7-Day Task Completion Trend (tasks marked completed, validated by approved report)
router.get('/task-trend', async (req, res) => {
  try {
    // Generate last 7 days as date strings
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    // Count tasks that were set to 'completed' each day
    // We use task_assignments.updated_at when status became 'completed'
    // Also cross-check: count daily_reports approved by mentors per day
    const taskCompletionResult = await pool.query(
      `SELECT DATE(ta.updated_at) as date, COUNT(DISTINCT ta.task_id) as completed_tasks
       FROM task_assignments ta
       WHERE ta.status = 'completed'
         AND ta.updated_at >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY DATE(ta.updated_at)
       ORDER BY date ASC`
    );

    const mentorValidatedResult = await pool.query(
      `SELECT DATE(dr.updated_at) as date, COUNT(*) as validated_count
       FROM daily_reports dr
       WHERE dr.status = 'approved'
         AND dr.updated_at >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY DATE(dr.updated_at)
       ORDER BY date ASC`
    );

    // Map results to day-indexed lookup
    const taskMap = {};
    taskCompletionResult.rows.forEach(r => {
      taskMap[r.date] = parseInt(r.completed_tasks);
    });
    const validatedMap = {};
    mentorValidatedResult.rows.forEach(r => {
      validatedMap[r.date] = parseInt(r.validated_count);
    });

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend = days.map(dateStr => {
      const d = new Date(dateStr + 'T00:00:00');
      return {
        date: dateStr,
        label: dayLabels[d.getDay()],
        completed: taskMap[dateStr] || 0,
        validated: validatedMap[dateStr] || 0,
      };
    });

    res.json({ trend });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leaderboard — Interns ranked by completed & mentor-validated tasks
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.batch_name,
         COUNT(DISTINCT ta.task_id) FILTER (WHERE ta.status = 'completed') as completed_tasks,
         COUNT(DISTINCT dr.id) FILTER (WHERE dr.status = 'approved') as validated_reports,
         COALESCE(rs.current_streak, 0) as current_streak,
         COALESCE(rs.longest_streak, 0) as longest_streak
       FROM users u
       LEFT JOIN task_assignments ta ON ta.assigned_to = u.id
       LEFT JOIN daily_reports dr ON dr.intern_id = u.id
       LEFT JOIN report_streaks rs ON rs.intern_id = u.id
       WHERE u.role = 'intern'
       GROUP BY u.id, u.name, u.batch_name, rs.current_streak, rs.longest_streak
       ORDER BY completed_tasks DESC, validated_reports DESC, current_streak DESC
       LIMIT 20`
    );

    const leaderboard = result.rows.map((row, idx) => ({
      rank: idx + 1,
      id: row.id,
      name: row.name,
      batch_name: row.batch_name,
      completed_tasks: parseInt(row.completed_tasks) || 0,
      validated_reports: parseInt(row.validated_reports) || 0,
      current_streak: parseInt(row.current_streak) || 0,
      longest_streak: parseInt(row.longest_streak) || 0,
    }));

    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
