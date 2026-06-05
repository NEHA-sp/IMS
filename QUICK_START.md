# 🚀 Quick Start Guide - New Features

**Last Updated:** June 4, 2026

---

## 📋 Step-by-Step Setup

### 1. Install Dependencies ✅
```bash
# Frontend
cd frontend
npm install @dnd-kit/sortable @dnd-kit/core @dnd-kit/utilities recharts

# Backend
cd ../backend
npm install node-cron nodemailer
```

### 2. Configure Environment Variables

Create/update `.env` in backend folder:

```bash
# Database (existing)
DATABASE_URL=postgresql://user:password@localhost:5432/ims_db

# Server (existing)
PORT=5000

# Email Reminders (NEW)
MAIL_HOST=smtp.ethereal.email
MAIL_PORT=587
MAIL_USER=your-email@ethereal.email
MAIL_PASSWORD=your-password
MAIL_FROM=noreply@topperias.com
APP_URL=http://localhost:3000
```

**Quick Setup for Testing:**
- Use Ethereal (free): https://ethereal.email/
- Create account → get credentials
- Add to `.env`

### 3. Initialize Database

```bash
cd backend
npm run init-db
```

**What it does:**
- Creates `task_templates` table
- All other tables already exist from Phase 5

### 4. Start Backend

```bash
cd backend
npm run dev
```

**Expected Output:**
```
Server running on http://localhost:5000
✅ Reminder system initialized
   • Daily report reminders: 9 AM
   • Deadline reminders: Every 2 hours
   • Status update reminders: 5 PM
   • Weekly summaries: Monday 10 AM
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 16.2.6
  - Local:        http://localhost:3000
```

---

## 🎮 Testing Each Feature

### Test 1: Kanban Board

**Steps:**
1. Open http://localhost:3000
2. Login as intern (test account or create new)
3. Go to **Tasks** → `/dashboard/intern/tasks`
4. Click **"Kanban"** button (top right)
5. Drag a task from "To Do" → "In Progress"
6. Task updates instantly ✨

**What to verify:**
- ✅ Drag-drop works smoothly
- ✅ Column counts update
- ✅ Status changes saved in database
- ✅ Can toggle back to "List" view

---

### Test 2: Gantt Chart

**Steps:**
1. Open http://localhost:3000
2. Login as **admin**
3. Click **"Analytics"** in sidebar (NEW!)
4. Click **"Gantt Chart"** button (top right)
5. Scroll to see all task timelines
6. Hover over bars to see details

**What to verify:**
- ✅ All tasks with deadlines appear
- ✅ Color matches status (green=done, amber=progress, red=blocked)
- ✅ Tooltips show priority and deadline
- ✅ Can toggle to "Kanban" view

---

### Test 3: Reminders (Email & In-app)

**Email Reminders:**
1. Ensure `.env` has email configured
2. Check backend logs during scheduled times:
   - 9 AM: Daily report reminder
   - Every 2 hours: Deadline reminder
   - 5 PM: Status update reminder
3. Check test email inbox (Ethereal, Gmail, etc.)

**In-app Notifications:**
1. Go to `/api/notifications` endpoint
2. Or wait for in-app alerts (bell icon when implemented)

**Logs to look for:**
```
✉️ Reminder sent to intern@email.com
✉️ Report reminder sent to...
⏰ Running daily report reminder task...
```

---

### Test 4: Task Templates

**Steps:**
1. Login as **admin** or **mentor**
2. Go to **Tasks** page
3. Look for "Propose New Task" button (intern only) OR
4. Create template in TaskTemplateManager component
5. Fill out template form:
   - Name: "Daily Report Summary"
   - Title: "Summary: {Date}"
   - Description: "Write 200-word summary..."
   - Priority: Medium
   - Est. days: 1
6. Click "Create Template"
7. Use template to create new task

**What to verify:**
- ✅ Template created successfully
- ✅ Template appears in list
- ✅ Creating task from template auto-fills fields
- ✅ Usage count increments

---

## 🔍 Verify Everything Works

### Run Health Check

```bash
curl http://localhost:5000/api/health
# Response: {"status":"Server is running"}
```

### Check Reminders Started

Look for this in backend console:
```
✅ Reminder system initialized
```

### Verify Database Tables

```bash
# In PostgreSQL client:
\dt task_templates;
SELECT * FROM task_templates;
```

---

## 🐛 Troubleshooting

### Issue: Kanban not working
```
Error: @dnd-kit not installed
Solution: npm install @dnd-kit/sortable @dnd-kit/core @dnd-kit/utilities
```

### Issue: Gantt chart not showing
```
Error: recharts not installed
Solution: npm install recharts
```

### Issue: Reminders not running
```
Error: Reminders in console but emails not received
Solution 1: Check MAIL_* in .env
Solution 2: Check spam/promotions folder
Solution 3: Try Ethereal account (free, doesn't require real email)
```

### Issue: Database migration failed
```
Error: task_templates table doesn't exist
Solution: npm run init-db
```

### Issue: CORS errors
```
Solution: Already configured in index.js
If persists: Check CORS settings match frontend URL
```

---

## 📊 Feature Status Dashboard

```
Feature              Status          Ready to Use
─────────────────────────────────────────────────
Kanban Board         ✅ Complete     YES
Gantt Chart          ✅ Complete     YES
Email Reminders      ✅ Complete     Setup required
In-app Reminders     ✅ Complete     YES
Task Templates       ✅ Complete     YES
Admin Analytics      ✅ Complete     YES
```

---

## 💾 Data I Should Know About

### Default Test Users
```
Admin:  admin@topperias.com / password123
Mentor: mentor@topperias.com / password123
Intern: intern1@topperias.com / password123
```

### Sample Tasks
- Pre-created in database for demo
- Can create new via UI
- Templates auto-populate fields

### Time Zones
- Reminders currently use UTC
- Can customize per user in Phase 8

---

## 📞 Quick Reference

### Important Files
- Kanban: `frontend/components/Kanban*.tsx`
- Gantt: `frontend/components/GanttChart.tsx`
- Reminders: `backend/services/reminderService.js`
- Templates: `backend/routes/templates.js`
- Analytics: `frontend/app/dashboard/admin/analytics/page.tsx`

### API Endpoints
```
GET    /api/templates              (list templates)
POST   /api/templates              (create template)
POST   /api/templates/:id/create-task  (use template)
PATCH  /api/tasks/:id/status       (update status)
GET    /api/tasks                  (list all tasks)
GET    /api/notifications          (get notifications)
```

### Environment Variables Needed
```
MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD,
MAIL_FROM, APP_URL
```

---

## ✅ Verification Checklist

Before considering setup complete:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can login with test accounts
- [ ] Kanban board loads and drag-drop works
- [ ] Gantt chart displays task timelines
- [ ] Reminder service initialized in backend logs
- [ ] Templates can be created and used
- [ ] Admin can see analytics dashboard

---

## 🎓 Next Steps

1. **Manual Testing:** Follow Test 1-4 above
2. **User Training:** Show interns Kanban, admins show Analytics
3. **Email Setup:** Configure real email for production
4. **Monitor:** Watch logs for reminders
5. **Feedback:** Gather user feedback for improvements

---

**Need Help?**
- Check logs: `npm run dev` output in terminal
- Check database: Use PostgreSQL client
- Check email: Look in spam folder
- Check browser console: DevTools → Console tab

🚀 **You're all set! Start using the new features now.**
