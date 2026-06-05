const pool = require('./db');

const createTables = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'mentor', 'intern')),
        mentor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        batch_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id),
        deadline TIMESTAMP,
        priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high')),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'under_review')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Task assignments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        assigned_to INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'under_review')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id, assigned_to)
      )
    `);

    // Daily reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id SERIAL PRIMARY KEY,
        intern_id INTEGER NOT NULL REFERENCES users(id),
        report_date DATE DEFAULT CURRENT_DATE,
        task_id INTEGER REFERENCES tasks(id),
        description TEXT,
        hours_worked DECIMAL(5, 2),
        completion_percentage INTEGER CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Blockers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blockers (
        id SERIAL PRIMARY KEY,
        intern_id INTEGER NOT NULL REFERENCES users(id),
        task_id INTEGER REFERENCES tasks(id),
        blocker_type VARCHAR(50) NOT NULL CHECK (blocker_type IN ('technical', 'requirement', 'dependency', 'system', 'communication')),
        description TEXT NOT NULL,
        severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
        resolved_by INTEGER REFERENCES users(id),
        resolution TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      )
    `);

    // Comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        report_id INTEGER NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Attendance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        intern_id INTEGER NOT NULL REFERENCES users(id),
        check_in TIMESTAMP,
        check_out TIMESTAMP,
        date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'leave')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(intern_id, date)
      )
    `);

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        related_entity_id INTEGER,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Knowledge Base table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // AI Suggestions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_suggestions (
        id SERIAL PRIMARY KEY,
        blocker_id INTEGER NOT NULL REFERENCES blockers(id) ON DELETE CASCADE,
        suggestion TEXT NOT NULL,
        confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
        feedback VARCHAR(50) DEFAULT 'pending' CHECK (feedback IN ('pending', 'helpful', 'not_helpful')),
        escalated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Report Streaks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_streaks (
        intern_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_submission_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Task Templates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_templates (
        id SERIAL PRIMARY KEY,
        created_by INTEGER NOT NULL REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        title_template VARCHAR(255) NOT NULL,
        description_template TEXT,
        priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        estimated_days INTEGER DEFAULT 7,
        category VARCHAR(100) DEFAULT 'general',
        is_public BOOLEAN DEFAULT FALSE,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

createTables();
