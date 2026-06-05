# Topper IAS - Intern Management & Progress Tracking System

Complete full-stack application for managing intern excellence and productivity at Topper IAS.

## Project Structure

```
IMS/
├── frontend/          # Next.js 14 with TypeScript + Tailwind CSS
│   ├── app/
│   │   ├── page.tsx              # Login page
│   │   ├── layout.tsx            # Root layout
│   │   └── dashboard/
│   │       ├── admin/            # Admin dashboard
│   │       ├── mentor/           # Mentor dashboard
│   │       └── intern/           # Intern dashboard
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   └── package.json
│
└── backend/           # Express.js + PostgreSQL
    ├── index.js                  # Main server
    ├── db.js                     # Database connection
    ├── init-db.js               # Database schema
    ├── middleware/
    │   └── auth.js              # JWT authentication
    ├── routes/
    │   ├── auth.js              # Login/Signup
    │   ├── interns.js           # Intern management
    │   ├── tasks.js             # Task management
    │   ├── reports.js           # Daily reports
    │   ├── blockers.js          # Blocker tracking
    │   └── dashboard.js         # Dashboard stats
    ├── .env                     # Environment variables
    └── package.json
```

## Features Implemented

### ✅ Phase 1 - Project Setup & Database
- ✓ Next.js 14 frontend with TypeScript
- ✓ Express.js backend with PostgreSQL
- ✓ Complete database schema with 8 tables
- ✓ JWT-based authentication

### ✅ Phase 2 - Authentication
- ✓ Login/Signup with role selection (Admin, Mentor, Intern)
- ✓ Password hashing with bcryptjs
- ✓ JWT token management
- ✓ Role-based access control middleware

### ✅ Phase 3 - Backend API
- ✓ Auth endpoints (login, signup)
- ✓ Intern management endpoints
- ✓ Task management endpoints
- ✓ Daily report endpoints
- ✓ Blocker tracking endpoints
- ✓ Dashboard statistics endpoints

### ✅ Phase 4 - Core UI & Dashboards
- ✓ Admin Dashboard with KPIs and analytics
- ✓ Mentor Dashboard with team management
- ✓ Intern Dashboard with task tracking
- ✓ Responsive design with Tailwind CSS
- ✓ Navigation sidebar

### ✅ Phase 5 - Task & Reporting
- ✓ Assignment Board for interns
- ✓ Daily Report submission form
- ✓ Task status tracking
- ✓ Progress monitoring

## Database Schema

### Users Table
- User management for Admin, Mentor, Intern roles
- Mentor assignment for interns
- Batch tracking

### Tasks Table
- Task creation and assignment
- Deadline and priority management
- Status tracking (pending, in_progress, completed, blocked, under_review)

### Task Assignments Table
- Track task assignments to interns
- Individual status tracking per assignment

### Daily Reports Table
- Daily progress tracking by interns
- Hours worked and completion percentage
- Report status (pending, approved, rejected)

### Blockers Table
- Blocker/issue reporting by interns
- Blocker categorization (technical, requirement, dependency, system, communication)
- Severity levels (low, medium, high, critical)
- Resolution tracking

### Comments Table
- Mentor feedback on reports
- Communication thread

### Attendance Table
- Check-in/check-out tracking
- Attendance status

### Notifications Table
- In-app notifications
- Notification status tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User signup

### Interns
- `GET /api/interns/` - Get all interns (Admin)
- `GET /api/interns/team` - Get mentor's interns (Mentor)
- `POST /api/interns/:internId/assign-mentor` - Assign mentor (Admin)

### Tasks
- `POST /api/tasks/` - Create task (Admin/Mentor)
- `GET /api/tasks/` - Get all tasks
- `GET /api/tasks/intern/assigned` - Get intern's tasks (Intern)
- `PATCH /api/tasks/:taskId/status` - Update task status

### Reports
- `POST /api/reports/daily` - Submit daily report (Intern)
- `GET /api/reports/daily` - Get daily reports
- `PATCH /api/reports/daily/:reportId/status` - Approve/reject report (Mentor/Admin)
- `POST /api/reports/:reportId/comments` - Add comment

### Blockers
- `POST /api/blockers/` - Report blocker (Intern)
- `GET /api/blockers/` - Get blockers
- `PATCH /api/blockers/:blockerId/resolve` - Resolve blocker (Mentor/Admin)

### Dashboard
- `GET /api/dashboard/admin` - Admin dashboard stats
- `GET /api/dashboard/mentor` - Mentor dashboard stats
- `GET /api/dashboard/intern` - Intern dashboard stats

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   Create `.env` file:
   ```
   PORT=5000
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ims_db
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

3. **Create database:**
   ```bash
   createdb ims_db
   ```

4. **Initialize database schema:**
   ```bash
   npm run init-db
   ```

5. **Start backend server:**
   ```bash
   npm run dev
   ```
   Backend runs on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**
   Create `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. **Start frontend server:**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`

## Test Credentials

Use these credentials to test different roles:

### Admin Account
- Email: `admin@topper.com`
- Password: `admin123`

### Mentor Account
- Email: `mentor@topper.com`
- Password: `mentor123`

### Intern Account
- Email: `intern@topper.com`
- Password: `intern123`

## Features Overview

### Admin Dashboard
- Total interns count with growth metrics
- Active tasks across cohorts
- Pending reviews requiring attention
- Critical blockers alert
- Weekly task completion chart
- Recent activity feed
- Quick actions (Add Intern, Assign Mentor, Export Report)

### Mentor Dashboard
- Assigned interns count
- Pending reviews from interns
- Blocked tasks in team
- Pending approvals with inline comment/approve buttons
- Blockers alert with quick resolution
- Team progress metrics (curriculum completion, review response time)

### Intern Dashboard
- Weekly progress percentage (circular progress)
- Today's prioritized tasks with status
- Daily summary submission button
- Latest mentor feedback
- Task board with filtering
- Daily report form with:
  - Task selection
  - Hours worked tracking
  - Completion percentage
  - Blocker categorization
  - Weekly milestone streak

## Technology Stack

### Frontend
- Next.js 14
- React 19
- TypeScript
- Tailwind CSS
- No external UI library (custom components)

### Backend
- Node.js & Express.js
- PostgreSQL 12+
- JWT for authentication
- bcryptjs for password hashing
- CORS enabled

### Database
- PostgreSQL
- 8 interconnected tables
- Foreign key relationships
- Automatic timestamps

## Deployment

### Frontend (Vercel)
```bash
npm install -g vercel
vercel
```

### Backend (Render/Railway)
1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Deploy

### Database (Supabase/Neon)
1. Create PostgreSQL instance
2. Update DATABASE_URL in backend .env
3. Run schema initialization

## Next Steps / Roadmap

### Phase 6 - Analytics & Insights
- [ ] Advanced performance charts
- [ ] Intern ranking/comparison
- [ ] Productivity trends
- [ ] Blocker pattern analysis
- [ ] Custom report generation

### Phase 7 - Notifications
- [ ] Email notifications (deadline approaching, task assigned, report approved)
- [ ] In-app notification center
- [ ] WhatsApp integration (optional)
- [ ] Slack integration (optional)

### Phase 8 - Advanced Features
- [ ] AI-powered performance predictions
- [ ] Sentiment analysis on feedback
- [ ] Automated productivity scoring
- [ ] Resume/portfolio tracking
- [ ] Certificate generation
- [ ] Attendance automation from activity logs

### Phase 9 - Mobile App
- [ ] React Native mobile app
- [ ] Push notifications
- [ ] Offline reporting capability

## Support

For issues or questions, contact the development team at: support@topper.com

---

**Version:** 1.0.0
**Last Updated:** May 31, 2026
**Built for:** Topper IAS Internship Management
