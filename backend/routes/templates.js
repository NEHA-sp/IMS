const express = require('express');
const pool = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Create a new template (Admin/Mentor)
router.post('/', roleMiddleware(['admin', 'mentor']), async (req, res) => {
  try {
    const { name, description, titleTemplate, descriptionTemplate, priority, estimatedDays, category, isPublic } = req.body;

    const result = await pool.query(
      `INSERT INTO task_templates (created_by, name, description, title_template, description_template, priority, estimated_days, category, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, name, description || '', titleTemplate, descriptionTemplate || '', priority || 'medium', estimatedDays || 7, category || 'general', isPublic || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all templates (public + user's private)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as created_by_name 
       FROM task_templates t
       JOIN users u ON t.created_by = u.id
       WHERE t.is_public = TRUE OR t.created_by = $1
       ORDER BY t.usage_count DESC, t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get templates by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const result = await pool.query(
      `SELECT t.*, u.name as created_by_name 
       FROM task_templates t
       JOIN users u ON t.created_by = u.id
       WHERE (t.is_public = TRUE OR t.created_by = $1)
       AND t.category = $2
       ORDER BY t.usage_count DESC`,
      [req.user.id, category]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task from template
router.post('/:templateId/create-task', roleMiddleware(['admin', 'mentor']), async (req, res) => {
  try {
    const { templateId } = req.params;
    const { title, assignTo, deadline } = req.body;

    // Get template
    const templateResult = await pool.query(
      'SELECT * FROM task_templates WHERE id = $1',
      [templateId]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templateResult.rows[0];

    // Create task from template
    const taskResult = await pool.query(
      `INSERT INTO tasks (title, description, created_by, deadline, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        title || template.title_template,
        template.description_template,
        req.user.id,
        deadline || new Date(Date.now() + template.estimated_days * 24 * 60 * 60 * 1000),
        template.priority,
        'pending'
      ]
    );

    // Assign to interns
    if (assignTo && Array.isArray(assignTo)) {
      for (const internId of assignTo) {
        await pool.query(
          'INSERT INTO task_assignments (task_id, assigned_to, status) VALUES ($1, $2, $3)',
          [taskResult.rows[0].id, internId, 'pending']
        );
      }
    }

    // Increment usage count
    await pool.query(
      'UPDATE task_templates SET usage_count = usage_count + 1 WHERE id = $1',
      [templateId]
    );

    res.status(201).json(taskResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.patch('/:templateId', roleMiddleware(['admin', 'mentor']), async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, description, titleTemplate, descriptionTemplate, priority, estimatedDays, category, isPublic } = req.body;

    const result = await pool.query(
      `UPDATE task_templates
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           title_template = COALESCE($3, title_template),
           description_template = COALESCE($4, description_template),
           priority = COALESCE($5, priority),
           estimated_days = COALESCE($6, estimated_days),
           category = COALESCE($7, category),
           is_public = COALESCE($8, is_public),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND created_by = $10
       RETURNING *`,
      [name, description, titleTemplate, descriptionTemplate, priority, estimatedDays, category, isPublic, templateId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete('/:templateId', roleMiddleware(['admin', 'mentor']), async (req, res) => {
  try {
    const { templateId } = req.params;

    const result = await pool.query(
      'DELETE FROM task_templates WHERE id = $1 AND created_by = $2 RETURNING id',
      [templateId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found or unauthorized' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
