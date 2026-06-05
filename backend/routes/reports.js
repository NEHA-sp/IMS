const express = require('express');
const pool = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Submit daily report (Intern)
router.post('/daily', roleMiddleware(['intern']), async (req, res) => {
  try {
    const { taskId, description, hoursWorked, completionPercentage } = req.body;

    const result = await pool.query(
      `INSERT INTO daily_reports (intern_id, task_id, description, hours_worked, completion_percentage, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, taskId, description, hoursWorked, completionPercentage, 'pending']
    );

    // Update Streak
    const today = new Date().toISOString().split('T')[0];
    const streakResult = await pool.query(
      'SELECT current_streak, longest_streak, last_submission_date FROM report_streaks WHERE intern_id = $1',
      [req.user.id]
    );

    if (streakResult.rows.length === 0) {
      // First streak entry
      await pool.query(
        'INSERT INTO report_streaks (intern_id, current_streak, longest_streak, last_submission_date) VALUES ($1, $2, $3, $4)',
        [req.user.id, 1, 1, today]
      );
    } else {
      const streak = streakResult.rows[0];
      const lastDateStr = streak.last_submission_date ? new Date(streak.last_submission_date).toISOString().split('T')[0] : null;

      if (lastDateStr === today) {
        // Already submitted today, streak doesn't change
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = 1;
        if (lastDateStr === yesterdayStr) {
          newStreak = parseInt(streak.current_streak) + 1;
        }

        const newLongest = Math.max(newStreak, parseInt(streak.longest_streak));

        await pool.query(
          'UPDATE report_streaks SET current_streak = $1, longest_streak = $2, last_submission_date = $3 WHERE intern_id = $4',
          [newStreak, newLongest, today, req.user.id]
        );
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily reports
router.get('/daily', async (req, res) => {
  try {
    const role = req.user.role;
    let query;
    let params = [];

    if (role === 'intern') {
      query = `SELECT dr.*, u.name, t.title as task_title FROM daily_reports dr 
               JOIN users u ON dr.intern_id = u.id 
               LEFT JOIN tasks t ON dr.task_id = t.id 
               WHERE dr.intern_id = $1 ORDER BY dr.created_at DESC`;
      params = [req.user.id];
    } else if (role === 'mentor') {
      query = `SELECT dr.*, u.name, t.title as task_title FROM daily_reports dr 
               JOIN users u ON dr.intern_id = u.id 
               LEFT JOIN tasks t ON dr.task_id = t.id 
               WHERE u.mentor_id = $1 ORDER BY dr.created_at DESC`;
      params = [req.user.id];
    } else {
      query = `SELECT dr.*, u.name, t.title as task_title FROM daily_reports dr 
               JOIN users u ON dr.intern_id = u.id 
               LEFT JOIN tasks t ON dr.task_id = t.id 
               ORDER BY dr.created_at DESC`;
    }

    const result = await pool.query(query, params.length > 0 ? params : []);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject report (Mentor/Admin)
router.patch('/daily/:reportId/status', roleMiddleware(['mentor', 'admin']), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE daily_reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, reportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to report
router.post('/:reportId/comments', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { comment } = req.body;

    const result = await pool.query(
      'INSERT INTO comments (report_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *',
      [reportId, req.user.id, comment]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
