const cron = require('node-cron');
const pool = require('../db');
const nodemailer = require('nodemailer');

// Configure email service (using test ethereal service for dev, update for production)
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.ethereal.email',
  port: process.env.MAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASSWORD || '',
  },
});

// Helper: Send deadline reminder email
async function sendDeadlineReminder(internId, internEmail, internName, tasks) {
  if (!internEmail) return;

  const urgentTasks = tasks.filter(t => {
    const deadline = new Date(t.deadline);
    const now = new Date();
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 24; // Due within 24 hours
  });

  if (urgentTasks.length === 0) return;

  const taskList = urgentTasks
    .map(t => `• ${t.title} (Due: ${new Date(t.deadline).toLocaleString()})`)
    .join('\n');

  const mailOptions = {
    from: process.env.MAIL_FROM || 'noreply@topperias.com',
    to: internEmail,
    subject: `⏰ Urgent: ${urgentTasks.length} task(s) due soon - Topper IAS`,
    html: `
      <h2>Hi ${internName},</h2>
      <p>You have <strong>${urgentTasks.length}</strong> task(s) due within the next 24 hours:</p>
      <pre>${taskList}</pre>
      <p>Please update their status or let your mentor know if you need help.</p>
      <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard/intern/tasks">View Tasks</a></p>
      <hr>
      <p><small>Topper IAS - Intern Management System</small></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Reminder sent to ${internEmail}`);
  } catch (err) {
    console.error('Error sending reminder email:', err);
  }
}

// Helper: Send daily report reminder
async function sendReportReminder(internId, internEmail, internName) {
  if (!internEmail) return;

  // Check if report already submitted today
  const reportCheck = await pool.query(
    `SELECT id FROM daily_reports 
     WHERE intern_id = $1 
     AND DATE(created_at) = CURRENT_DATE`,
    [internId]
  );

  if (reportCheck.rows.length > 0) return; // Report already submitted

  const mailOptions = {
    from: process.env.MAIL_FROM || 'noreply@topperias.com',
    to: internEmail,
    subject: `📝 Reminder: Submit Your Daily Report - Topper IAS`,
    html: `
      <h2>Hi ${internName},</h2>
      <p>Don't forget to submit your daily report before end of day!</p>
      <p>Your report helps us track:</p>
      <ul>
        <li>Hours worked</li>
        <li>Task progress</li>
        <li>Any blockers or challenges</li>
      </ul>
      <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard/intern/reports">Submit Report Now</a></p>
      <hr>
      <p><small>Topper IAS - Intern Management System</small></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Report reminder sent to ${internEmail}`);
  } catch (err) {
    console.error('Error sending report reminder:', err);
  }
}

// Helper: Create in-app notification
async function createNotification(userId, type, title, message, relatedEntityId) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_entity_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, message, relatedEntityId]
    );
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

// ┌─────────────────────────────────────────────────────────────┐
// │ SCHEDULED TASKS                                             │
// └─────────────────────────────────────────────────────────────┘

// Task 1: Daily 9 AM - Remind interns about daily reports (if not submitted)
const dailyReportReminder = cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Running daily report reminder task...');
  try {
    const interns = await pool.query(
      `SELECT id, email, name FROM users WHERE role = 'intern'`
    );

    for (const intern of interns.rows) {
      await sendReportReminder(intern.id, intern.email, intern.name);
    }
  } catch (err) {
    console.error('Error in daily report reminder task:', err);
  }
});

// Task 2: Every 2 hours - Check for tasks due within 24 hours
const deadlineReminder = cron.schedule('0 */2 * * *', async () => {
  console.log('⏰ Running deadline reminder task...');
  try {
    const interns = await pool.query(
      `SELECT DISTINCT u.id, u.email, u.name 
       FROM users u
       JOIN task_assignments ta ON u.id = ta.assigned_to
       JOIN tasks t ON ta.task_id = t.id
       WHERE u.role = 'intern' 
       AND ta.status NOT IN ('completed', 'blocked')
       AND t.deadline IS NOT NULL`
    );

    for (const intern of interns.rows) {
      const tasks = await pool.query(
        `SELECT t.id, t.title, t.deadline, ta.status
         FROM tasks t
         JOIN task_assignments ta ON t.id = ta.task_id
         WHERE ta.assigned_to = $1
         AND ta.status NOT IN ('completed', 'blocked')
         AND t.deadline IS NOT NULL
         AND t.deadline > NOW()`,
        [intern.id]
      );

      if (tasks.rows.length > 0) {
        await sendDeadlineReminder(intern.id, intern.email, intern.name, tasks.rows);
      }
    }
  } catch (err) {
    console.error('Error in deadline reminder task:', err);
  }
});

// Task 3: End of day (5 PM) - Check for interns who didn't update task status
const statusUpdateReminder = cron.schedule('0 17 * * *', async () => {
  console.log('⏰ Running status update reminder task...');
  try {
    const interns = await pool.query(
      `SELECT DISTINCT u.id, u.email, u.name 
       FROM users u
       JOIN task_assignments ta ON u.id = ta.assigned_to
       WHERE u.role = 'intern'
       AND ta.status IN ('pending', 'in_progress')`
    );

    for (const intern of interns.rows) {
      const unreviewedTasks = await pool.query(
        `SELECT COUNT(*) FROM task_assignments
         WHERE assigned_to = $1
         AND status IN ('pending', 'in_progress')
         AND updated_at < NOW() - INTERVAL '1 day'`,
        [intern.id]
      );

      if (parseInt(unreviewedTasks.rows[0].count) > 0) {
        await createNotification(
          intern.id,
          'task_update_reminder',
          'Task Status Update Needed',
          `You have ${unreviewedTasks.rows[0].count} task(s) that haven't been updated today. Please update their status.`,
          null
        );
      }
    }
  } catch (err) {
    console.error('Error in status update reminder task:', err);
  }
});

// Task 4: Weekly (Monday 10 AM) - Performance summary
const weeklyPerformanceSummary = cron.schedule('0 10 * * 1', async () => {
  console.log('⏰ Running weekly performance summary task...');
  try {
    const mentors = await pool.query(
      `SELECT DISTINCT id, email, name FROM users WHERE role = 'mentor'`
    );

    for (const mentor of mentors.rows) {
      const mentorTeam = await pool.query(
        `SELECT id, name FROM users WHERE mentor_id = $1 AND role = 'intern'`,
        [mentor.id]
      );

      const weekStats = await pool.query(
        `SELECT 
           COUNT(ta.id) as total_tasks,
           SUM(CASE WHEN ta.status = 'completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN ta.status = 'blocked' THEN 1 ELSE 0 END) as blocked
         FROM task_assignments ta
         WHERE ta.assigned_to IN (${mentorTeam.rows.map(t => t.id).join(',') || 'NULL'})
         AND ta.updated_at > NOW() - INTERVAL '7 days'`
      );

      const stats = weekStats.rows[0];
      await createNotification(
        mentor.id,
        'weekly_summary',
        'Weekly Performance Summary',
        `This week: ${stats.total_tasks} tasks, ${stats.completed} completed, ${stats.blocked} blocked`,
        null
      );
    }
  } catch (err) {
    console.error('Error in weekly performance summary task:', err);
  }
});

// Initialize reminders
const initializeReminders = () => {
  console.log('✅ Reminder system initialized');
  console.log('   • Daily report reminders: 9 AM');
  console.log('   • Deadline reminders: Every 2 hours');
  console.log('   • Status update reminders: 5 PM');
  console.log('   • Weekly summaries: Monday 10 AM');
};

module.exports = {
  initializeReminders,
  sendDeadlineReminder,
  sendReportReminder,
  createNotification,
};
