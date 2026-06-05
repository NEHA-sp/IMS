const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const internRoutes = require('./routes/interns');
const taskRoutes = require('./routes/tasks');
const reportRoutes = require('./routes/reports');
const blockerRoutes = require('./routes/blockers');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');
const kbRoutes = require('./routes/knowledge-base');
const notificationRoutes = require('./routes/notifications');
const templateRoutes = require('./routes/templates');
const { initializeReminders } = require('./services/reminderService');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interns', internRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/blockers', blockerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Initialize reminder system
  initializeReminders();
});
