const pool = require('./db');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('Seeding database...');

    // Clear old data
    await pool.query('TRUNCATE TABLE ai_suggestions, notifications, comments, daily_reports, blockers, task_assignments, tasks, attendance, report_streaks, users RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE TABLE knowledge_base RESTART IDENTITY CASCADE');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Admins and Mentors
    const admin = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['System Admin', 'admin@topperias.com', hashedPassword, 'admin']
    );

    const mentor1 = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Dr. Vikas Kumar', 'vikas.kumar@topperias.com', hashedPassword, 'mentor']
    );

    const mentor2 = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Prof. Sunita Sharma', 'sunita.sharma@topperias.com', hashedPassword, 'mentor']
    );

    // 2. Create Interns
    const internNames = ['Neha Rao', 'Rahul Gupta', 'Priya Patel', 'Amit Singh', 'Ananya Das'];
    const interns = [];

    for (let i = 0; i < internNames.length; i++) {
      const mentorId = i % 2 === 0 ? mentor1.rows[0].id : mentor2.rows[0].id;
      const intern = await pool.query(
        `INSERT INTO users (name, email, password, role, mentor_id, batch_name)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name`,
        [internNames[i], `intern${i + 1}@topperias.com`, hashedPassword, 'intern', mentorId, 'UPSC Batch 2026-A']
      );
      interns.push(intern.rows[0]);

      // Seed initial streaks
      await pool.query(
        'INSERT INTO report_streaks (intern_id, current_streak, longest_streak, last_submission_date) VALUES ($1, 0, 0, NULL)',
        [intern.rows[0].id]
      );
    }

    // 3. Create 15 Knowledge Base Entries (IAS Specific)
    const kbEntries = [
      {
        category: 'technical',
        question: 'How do I log into the Portal CMS to upload new GS mains handouts?',
        answer: 'Navigate to cms.topperias.com, select GS-Mains under active templates. Ensure you are connected to the main office VPN or using your secure work email login. If you get a 403 error, email systems@topperias.com to request access to the "GS-Handouts" Google Cloud IAM group.'
      },
      {
        category: 'technical',
        question: 'UPSC Mains Mock Test evaluation panel is not saving comments. What should I do?',
        answer: 'This is a cached session issue. Log out, clear your browser local storage/cache for evaluate.topperias.com, and reload. Keep your evaluated PDF comments saved locally before submitting.'
      },
      {
        category: 'requirement',
        question: 'What is the word limit and format guideline for the Daily Current Affairs Summary?',
        answer: 'Each news analysis must be exactly 150-250 words, structured as: 1. Why in News, 2. Key Highlights, 3. Relevance to Prelims/Mains (Syllabus GS-I/II/III). Submit all summaries in Markdown format.'
      },
      {
        category: 'dependency',
        question: 'Waiting for Senior Content Reviewer feedback on GS-III Economy Answer Key.',
        answer: 'Senior content reviewers have a 24-hour SLA. If they exceed this, post the draft link in the MS Teams channel #content-review with tag @VikasKumar for immediate manual approval.'
      },
      {
        category: 'system',
        question: 'How to report server downtime for the test series platform?',
        answer: 'Send a high priority alert to slack channel #dev-alerts or ping the Dev Lead. Do not attempt to reboot the local server yourself.'
      },
      {
        category: 'technical',
        question: 'Where can I find the standard LaTeX template for UPSC Mains Model Answers?',
        answer: 'Standard templates are hosted in the git repository at github.com/topper-ias/templates-latex. Use the folder mains-model-answers-v3. Ensure you compile using pdfLaTeX.'
      },
      {
        category: 'communication',
        question: 'How do I request a 1-on-1 feedback session with my assigned mentor?',
        answer: 'Mentors host open office hours every Tuesday and Thursday from 4 PM to 6 PM. Schedule a slot directly through their Google Calendar link listed on your mentor profile.'
      },
      {
        category: 'requirement',
        question: 'How are Prelims CSAT explanation videos organized in the library?',
        answer: 'CSAT videos must be categorized by Topic (e.g., Quantitative Aptitude, Logical Reasoning, Reading Comprehension). File format must be MP4, H.264, 1080p, with clear audio. Naming convention: CSAT_[Topic]_[SubTopic]_2026.mp4.'
      },
      {
        category: 'technical',
        question: 'Google Forms evaluation responses are not sync\'ing with the main dashboard spreadsheet.',
        answer: 'Open the Google Sheet, go to Extensions -> Apps Script, and click "Run SyncTrigger". If authorization fails, re-authenticate using the dev@topperias.com shared credentials.'
      },
      {
        category: 'dependency',
        question: 'Missing GS Paper II Polity handouts from the design team.',
        answer: 'Contact the Lead Designer on Slack (@RahulDesign) or send a reminder on their ticket. If delayed by more than 2 days, escalate to the Admin for approval to use plain text PDFs.'
      },
      {
        category: 'system',
        question: 'My office Microsoft Teams or Zoom account is locked out.',
        answer: 'Please contact IT Helpdesk (it@topperias.com) with your employee ID. The standard SLA for lockouts is 2 hours.'
      },
      {
        category: 'requirement',
        question: 'What sources should I use for UPSC Daily PIB (Press Information Bureau) summaries?',
        answer: 'Only use official pib.gov.in releases. Avoid third-party news blogs. Prioritize releases from the Ministry of Finance, MEA, MoEFCC, and MoSPI.'
      },
      {
        category: 'technical',
        question: 'How do I edit or delete a daily report after submitting it?',
        answer: 'Daily reports cannot be edited once submitted. If you need to make changes, comment directly on the report or ask your mentor to unlock it.'
      },
      {
        category: 'communication',
        question: 'Intern monthly stipend processing timeline.',
        answer: 'Stipends are processed on the 1st of every month. Ensure your bank details are updated in your Profile page. Email admin@topperias.com for payroll issues.'
      },
      {
        category: 'requirement',
        question: 'How to draft the Monthly UPSC Trend Analysis Report?',
        answer: 'Include a comparative analysis of the last 5 years of Prelims questions, highlighting weightage trends (e.g. environment increases, history decreases). Structure with beautiful charts.'
      }
    ];

    for (const kb of kbEntries) {
      await pool.query(
        'INSERT INTO knowledge_base (category, question, answer) VALUES ($1, $2, $3)',
        [kb.category, kb.question, kb.answer]
      );
    }

    // 4. Create Standard Tasks
    const taskTitles = [
      'Draft Model Answers for GS-II Laxmikanth Chapter 5',
      'Verify PIB Releases for Ministry of Finance (May 2026)',
      'Evaluate 5 UPSC Mains Essay Mock Tests',
      'Develop LaTeX slides for Art & Culture',
      'Review CSAT Video Explanations for Percentages'
    ];

    const tasks = [];
    for (let i = 0; i < taskTitles.length; i++) {
      const task = await pool.query(
        `INSERT INTO tasks (title, description, created_by, deadline, priority, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title`,
        [
          taskTitles[i],
          `Complete deep-dive research and formulation for: ${taskTitles[i]}`,
          mentor1.rows[0].id,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          i % 2 === 0 ? 'high' : 'medium',
          'pending'
        ]
      );
      tasks.push(task.rows[0]);

      // Assign to interns
      for (const intern of interns) {
        await pool.query(
          'INSERT INTO task_assignments (task_id, assigned_to, status) VALUES ($1, $2, $3)',
          [task.rows[0].id, intern.id, 'pending']
        );
      }
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();
