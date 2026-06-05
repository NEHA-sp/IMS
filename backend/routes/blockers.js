const express = require('express');
const pool = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Report blocker (Intern)
router.post('/', roleMiddleware(['intern']), async (req, res) => {
  try {
    const { taskId, blockerType, description, severity } = req.body;

    const result = await pool.query(
      `INSERT INTO blockers (intern_id, task_id, blocker_type, description, severity, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, taskId, blockerType, description, severity || 'medium', 'open']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blockers
router.get('/', async (req, res) => {
  try {
    const role = req.user.role;
    let query;
    let params = [];

    if (role === 'intern') {
      query = `SELECT b.*, u.name, t.title as task_title FROM blockers b 
               JOIN users u ON b.intern_id = u.id 
               LEFT JOIN tasks t ON b.task_id = t.id 
               WHERE b.intern_id = $1 ORDER BY b.created_at DESC`;
      params = [req.user.id];
    } else if (role === 'mentor') {
      query = `SELECT b.*, u.name, t.title as task_title FROM blockers b 
               JOIN users u ON b.intern_id = u.id 
               LEFT JOIN tasks t ON b.task_id = t.id 
               WHERE u.mentor_id = $1 ORDER BY b.severity DESC, b.created_at DESC`;
      params = [req.user.id];
    } else {
      query = `SELECT b.*, u.name, t.title as task_title FROM blockers b 
               JOIN users u ON b.intern_id = u.id 
               LEFT JOIN tasks t ON b.task_id = t.id 
               ORDER BY b.severity DESC, b.created_at DESC`;
    }

    const result = await pool.query(query, params.length > 0 ? params : []);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve blocker (Mentor/Admin)
router.patch('/:blockerId/resolve', roleMiddleware(['mentor', 'admin']), async (req, res) => {
  try {
    const { blockerId } = req.params;
    const { resolution } = req.body;

    const result = await pool.query(
      `UPDATE blockers SET status = $1, resolved_by = $2, resolution = $3, resolved_at = CURRENT_TIMESTAMP 
       WHERE id = $4 RETURNING *`,
      ['resolved', req.user.id, resolution, blockerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blocker not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
