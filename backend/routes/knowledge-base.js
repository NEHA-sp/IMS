const express = require('express');
const pool = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/kb - List all KB entries
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM knowledge_base';
    let params = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/kb - Add new FAQ (Admin/Mentor)
router.post('/', roleMiddleware(['admin', 'mentor']), async (req, res) => {
  try {
    const { category, question, answer } = req.body;
    if (!category || !question || !answer) {
      return res.status(400).json({ error: 'category, question, and answer are required' });
    }

    const result = await pool.query(
      `INSERT INTO knowledge_base (category, question, answer)
       VALUES ($1, $2, $3) RETURNING *`,
      [category, question, answer]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/kb/:id - Update FAQ (Admin/Mentor)
router.patch('/:id', roleMiddleware(['admin', 'mentor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { category, question, answer } = req.body;

    const result = await pool.query(
      `UPDATE knowledge_base
       SET category = COALESCE($1, category),
           question = COALESCE($2, question),
           answer = COALESCE($3, answer)
       WHERE id = $4 RETURNING *`,
      [category, question, answer, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Knowledge base entry not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/kb/:id - Delete FAQ (Admin only)
router.delete('/:id', roleMiddleware(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM knowledge_base WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Knowledge base entry not found' });
    }

    res.json({ message: 'Knowledge base entry deleted successfully', entry: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
