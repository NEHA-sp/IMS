const pool = require('../db');

// Add task_templates table if it doesn't exist
const createTaskTemplatesTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_templates (
        id SERIAL PRIMARY KEY,
        created_by INTEGER NOT NULL REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        title_template VARCHAR(255) NOT NULL,
        description_template TEXT,
        priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        estimated_days INTEGER,
        category VARCHAR(100),
        is_public BOOLEAN DEFAULT FALSE,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ task_templates table created successfully');
  } catch (error) {
    console.error('Error creating task_templates table:', error);
  }
};

module.exports = { createTaskTemplatesTable };
