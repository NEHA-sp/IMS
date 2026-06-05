const express = require('express');
const pool = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Get all interns (Admin only)
router.get('/', roleMiddleware(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, mentor_id, role, batch_name, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
      ['intern']
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all mentors (Admin only)
router.get('/mentors', roleMiddleware(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE role = $1 ORDER BY name ASC',
      ['mentor']
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mentor's interns
router.get('/team', roleMiddleware(['mentor']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, batch_name, created_at FROM users WHERE role = $1 AND mentor_id = $2',
      ['intern', req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign mentor to intern (Admin only)
router.post('/:internId/assign-mentor', roleMiddleware(['admin']), async (req, res) => {
  try {
    const { internId } = req.params;
    const { mentorId } = req.body;

    const result = await pool.query(
      'UPDATE users SET mentor_id = $1 WHERE id = $2 AND role = $3 RETURNING id, name, email, mentor_id',
      [mentorId, internId, 'intern']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Intern not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
