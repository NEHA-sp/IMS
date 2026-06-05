const express = require('express');
const pool = require('../db');
const llmService = require('../services/llmService');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// POST /api/ai/resolve-blocker
// Body: { blockerId, description, category }
router.post('/resolve-blocker', async (req, res) => {
  try {
    const { blockerId, description, category } = req.body;

    if (!blockerId || !description || !category) {
      return res.status(400).json({ error: 'blockerId, description, and category are required' });
    }

    // 1. Search knowledge_base for similar resolved issues
    // Split description into keywords for simple text search
    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3);

    let kbEntries = [];
    if (words.length > 0) {
      // Build ILIKE query dynamically
      const conditions = words.map((_, i) => `(question ILIKE $${i + 1} OR answer ILIKE $${i + 1})`).join(' OR ');
      const query = `SELECT * FROM knowledge_base WHERE category = $${words.length + 1} AND (${conditions}) LIMIT 5`;
      const params = [...words.map(w => `%${w}%`), category];
      
      const kbResult = await pool.query(query, params);
      kbEntries = kbResult.rows;
    }

    // If no specific word matches found, get last 5 in same category
    if (kbEntries.length === 0) {
      const kbFallback = await pool.query(
        'SELECT * FROM knowledge_base WHERE category = $1 ORDER BY id DESC LIMIT 5',
        [category]
      );
      kbEntries = kbFallback.rows;
    }

    // 2. Call LLM Service
    const aiResult = await llmService.getBlockerSuggestion(description, category, kbEntries);

    // 3. Save suggestion to ai_suggestions table
    const insertResult = await pool.query(
      `INSERT INTO ai_suggestions (blocker_id, suggestion, confidence, feedback, escalated)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
      [blockerId, aiResult.suggestion, aiResult.confidence, 'pending', aiResult.escalated]
    );

    const savedSuggestion = insertResult.rows[0] || {
      blocker_id: blockerId,
      suggestion: aiResult.suggestion,
      confidence: aiResult.confidence,
      feedback: 'pending',
      escalated: aiResult.escalated
    };

    // If escalated = true, update blocker status or trigger notification to mentor/intern
    if (aiResult.escalated) {
      // Get mentor ID of the intern
      const internResult = await pool.query(
        'SELECT mentor_id, name FROM users WHERE id = $1',
        [req.user.id]
      );
      const intern = internResult.rows[0];

      if (intern && intern.mentor_id) {
        // Notify mentor
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, related_entity_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            intern.mentor_id,
            'blocker_escalated',
            `Blocker Escalated: ${intern.name}`,
            `Intern ${intern.name} reported a ${category} blocker. AI confidence was low (${aiResult.confidence}%), requiring your manual attention.`,
            blockerId
          ]
        );
      }
    } else {
      // Notify intern that AI suggested a solution
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_entity_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          'ai_suggestion',
          'AI Suggestion Available',
          `An automated solution is available for your blocker: "${description.substring(0, 30)}..."`,
          blockerId
        ]
      );
    }

    res.json({
      ...savedSuggestion,
      kbEntriesUsed: kbEntries.map(e => ({ id: e.id, question: e.question }))
    });

  } catch (error) {
    console.error('Error resolving blocker with AI:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/feedback
// Body: { suggestionId, blockerId, feedback } // 'helpful' or 'not_helpful'
router.post('/feedback', async (req, res) => {
  try {
    const { suggestionId, blockerId, feedback } = req.body;

    if (!suggestionId || !feedback) {
      return res.status(400).json({ error: 'suggestionId and feedback are required' });
    }

    // Update feedback in ai_suggestions
    const result = await pool.query(
      `UPDATE ai_suggestions SET feedback = $1 WHERE id = $2 RETURNING *`,
      [feedback, suggestionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'AI Suggestion not found' });
    }

    const suggestion = result.rows[0];

    if (feedback === 'helpful') {
      // 1. Mark blocker as resolved
      await pool.query(
        `UPDATE blockers SET status = 'resolved', resolution = $1, resolved_by = $2, resolved_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [`Resolved via AI automated suggestion: ${suggestion.suggestion}`, req.user.id, blockerId]
      );

      // 2. Add to knowledge_base so it helps others
      const blockerInfo = await pool.query(
        'SELECT blocker_type, description FROM blockers WHERE id = $1',
        [blockerId]
      );
      if (blockerInfo.rows.length > 0) {
        const { blocker_type, description } = blockerInfo.rows[0];
        await pool.query(
          `INSERT INTO knowledge_base (category, question, answer)
           VALUES ($1, $2, $3)`,
          [blocker_type, description, suggestion.suggestion]
        );
      }
    } else {
      // feedback is 'not_helpful' -> Escalate to mentor
      await pool.query(
        `UPDATE ai_suggestions SET escalated = TRUE WHERE id = $1`,
        [suggestionId]
      );

      const internResult = await pool.query(
        'SELECT u.mentor_id, u.name, b.blocker_type, b.description FROM users u JOIN blockers b ON b.intern_id = u.id WHERE b.id = $1',
        [blockerId]
      );
      const info = internResult.rows[0];

      if (info && info.mentor_id) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, related_entity_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            info.mentor_id,
            'blocker_escalated',
            `Blocker Escalation: ${info.name}`,
            `AI suggestion was marked not helpful by ${info.name}. Manual intervention required. Blocker: ${info.description.substring(0, 50)}...`,
            blockerId
          ]
        );
      }
    }

    res.json({ message: 'Feedback updated successfully', suggestion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
