const express = require('express');
const pool = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Create task (Admin/Mentor)
router.post('/', roleMiddleware(['admin', 'mentor']), async (req, res) => {
  try {
    const { title, description, deadline, priority, assignTo } = req.body;

    const taskResult = await pool.query(
      'INSERT INTO tasks (title, description, created_by, deadline, priority, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, req.user.id, deadline, priority, 'pending']
    );

    if (assignTo && Array.isArray(assignTo)) {
      for (const internId of assignTo) {
        await pool.query(
          'INSERT INTO task_assignments (task_id, assigned_to, status) VALUES ($1, $2, $3)',
          [taskResult.rows[0].id, internId, 'pending']
        );
      }
    }

    res.status(201).json(taskResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.*, u.name as created_by_name FROM tasks t JOIN users u ON t.created_by = u.id ORDER BY t.created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get intern's tasks
router.get('/intern/assigned', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, ta.status as assignment_status FROM tasks t 
       JOIN task_assignments ta ON t.id = ta.task_id 
       WHERE ta.assigned_to = $1 
       ORDER BY t.deadline ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task status
router.patch('/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Also update assignment status if status matches
    await pool.query(
      'UPDATE task_assignments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE task_id = $2',
      [status, taskId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Propose a task (Intern)
router.post('/propose', roleMiddleware(['intern']), async (req, res) => {
  try {
    const { title, description, deadline, priority } = req.body;

    const taskResult = await pool.query(
      'INSERT INTO tasks (title, description, created_by, deadline, priority, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, req.user.id, deadline, priority || 'medium', 'under_review']
    );

    await pool.query(
      'INSERT INTO task_assignments (task_id, assigned_to, status) VALUES ($1, $2, $3)',
      [taskResult.rows[0].id, req.user.id, 'under_review']
    );

    // Notify mentor
    const internResult = await pool.query(
      'SELECT mentor_id, name FROM users WHERE id = $1',
      [req.user.id]
    );
    const intern = internResult.rows[0];
    if (intern && intern.mentor_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_entity_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          intern.mentor_id,
          'task_proposed',
          'New Task Proposed',
          `${intern.name} has proposed a new task: "${title}".`,
          taskResult.rows[0].id
        ]
      );
    }

    res.status(201).json(taskResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject proposed task (Admin/Mentor)
router.patch('/:taskId/approve', roleMiddleware(['admin', 'mentor']), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const targetStatus = action === 'approve' ? 'pending' : 'completed'; // or delete/cancel. Let's use 'pending' for approved, or we can just update status
    
    let result;
    if (action === 'approve') {
      result = await pool.query(
        "UPDATE tasks SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
        [taskId]
      );
      await pool.query(
        "UPDATE task_assignments SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE task_id = $1",
        [taskId]
      );
    } else {
      // Reject: We can set task status to completed (archive) or delete it. Let's just delete the assignment and task or keep it marked as completed.
      result = await pool.query(
        "UPDATE tasks SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
        [taskId]
      );
      await pool.query(
        "UPDATE task_assignments SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE task_id = $1",
        [taskId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Notify intern
    const task = result.rows[0];
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_entity_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        task.created_by,
        'task_approval',
        action === 'approve' ? 'Task Approved' : 'Task Rejected',
        `Your proposed task "${task.title}" has been ${action}d by ${req.user.name}.`,
        taskId
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
