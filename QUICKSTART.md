# 🚀 Quick Start Guide - Topper IAS IMS

## 📋 What's Been Built

✅ **Phase 1: Complete** - Full-stack setup (Next.js, Express, PostgreSQL)
✅ **Phase 2: Complete** - Authentication system with JWT & role-based access
✅ **Phase 3: Complete** - 6 backend API modules with 20+ endpoints
✅ **Phase 4: Complete** - 3 responsive dashboards (Admin, Mentor, Intern)
✅ **Phase 5: Complete** - Task management & daily reporting system

## 📁 Project Files

### Frontend (`/frontend`)
```
✓ Login page with role selection
✓ Admin Dashboard - KPIs, analytics, activity feed
✓ Mentor Dashboard - Team management, blockers alert
✓ Intern Dashboard - Task tracking, progress monitoring
✓ Intern Report Form - Daily submission
✓ Intern Tasks Board - Assignment tracking
✓ Admin Interns Management - User table
✓ Sidebar & Navbar components
✓ Tailwind CSS styling
```

### Backend (`/backend`)
```
✓ Authentication module (JWT, bcrypt)
✓ Intern management endpoints
✓ Task management endpoints
✓ Daily reports endpoints
✓ Blockers tracking endpoints
✓ Dashboard statistics endpoints
✓ Database initialization script
✓ Role-based middleware
```

### Database Schema
```
✓ Users (id, name, email, password, role, mentor_id, batch_name)
✓ Tasks (id, title, description, created_by, deadline, priority, status)
✓ Task Assignments (id, task_id, assigned_to, status)
✓ Daily Reports (id, intern_id, task_id, description, hours_worked, completion_percentage)
✓ Blockers (id, intern_id, task_id, blocker_type, description, severity, status)
✓ Comments (id, report_id, user_id, comment)
✓ Attendance (id, intern_id, check_in, check_out, date, status)
✓ Notifications (id, user_id, type, title, message, is_read)
```

## 🔧 SETUP INSTRUCTIONS

### STEP 1: Setup PostgreSQL Database

**Windows:**
```
# Download PostgreSQL from https://www.postgresql.org/download/windows/
# Or use installed version

# Open pgAdmin 4 or psql command line
# Create database:
createdb ims_db
```

**Or if using Docker:**
```
docker run --name ims-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ims_db \
  -p 5432:5432 \
  -d postgres:15
```

### STEP 2: Setup Backend

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create .env file with these settings
# (It's already created, verify contents)
cat .env

# Expected output:
# PORT=5000
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ims_db
# JWT_SECRET=your_jwt_secret_key_change_this_in_production
# NODE_ENV=development

# 3. Initialize database schema
npm run init-db

# 4. Start backend server
npm run dev

# ✓ You should see: "Server running on http://localhost:5000"
```

### STEP 3: Setup Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Verify .env.local exists
cat .env.local

# Expected:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

# 3. Start frontend dev server
npm run dev

# ✓ You should see: "▲ Next.js 14.0.3"
# Open browser to http://localhost:3000
```

## 🧪 TEST THE APP

### Access the App
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### Test Login Credentials

#### Admin Account
```
Email: admin@topper.com
Password: admin123
```

#### Mentor Account
```
Email: mentor@topper.com
Password: mentor123
```

#### Intern Account
```
Email: intern@topper.com
Password: intern123
```

### Test Workflows

#### 1. Admin Dashboard
1. Login with admin credentials
2. View dashboard with 4 KPI cards (Total Interns, Active Tasks, Pending Reviews, Critical Blockers)
3. See weekly completion chart
4. View recent activity feed
5. Click "Add Intern", "Assign Mentor", "Export Report" buttons

#### 2. Mentor Dashboard
1. Login with mentor credentials
2. View assigned interns count
3. See pending approvals section
4. View blockers alert
5. Check team progress metrics
6. Click "New Task" and "Blast Mail" buttons

#### 3. Intern Dashboard
1. Login with intern credentials
2. View weekly progress (circular chart)
3. See today's prioritized tasks
4. Click "Submit Daily Report" button
5. Navigate to "Assignment Board" (Tasks tab)
6. View all assigned tasks with status

## 📊 API Testing with cURL

### Test Backend Health
```bash
curl http://localhost:5000/api/health
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@topper.com","password":"admin123"}'
```

### Test Getting Dashboard Stats
```bash
curl http://localhost:5000/api/dashboard/admin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛠️ Project Structure Visualization

```
IMS (root)
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx ..................... Login Page
│   │   ├── layout.tsx ................... Root Layout
│   │   └── dashboard/
│   │       ├── admin/page.tsx ........... Admin Dashboard
│   │       ├── admin/interns/page.tsx ... Manage Interns
│   │       ├── mentor/page.tsx ......... Mentor Dashboard
│   │       ├── mentor/blockers/page.tsx . Blockers Page
│   │       ├── mentor/tasks/page.tsx ... Task Board (Mentor)
│   │       ├── intern/page.tsx ......... Intern Dashboard
│   │       ├── intern/tasks/page.tsx ... Task Board (Intern)
│   │       └── intern/reports/page.tsx . Daily Report Form
│   │
│   ├── components/
│   │   ├── Navbar.tsx .................. Navigation Bar
│   │   └── Sidebar.tsx ................. Left Sidebar Menu
│   │
│   ├── .env.local ...................... Environment Config
│   └── package.json .................... Dependencies
│
├── backend/
│   ├── index.js ....................... Main Server
│   ├── db.js .......................... DB Connection
│   ├── init-db.js ..................... Schema Setup
│   │
│   ├── middleware/
│   │   └── auth.js .................... JWT Middleware
│   │
│   ├── routes/
│   │   ├── auth.js .................... Auth Endpoints
│   │   ├── interns.js ................. Intern APIs
│   │   ├── tasks.js ................... Task APIs
│   │   ├── reports.js ................. Report APIs
│   │   ├── blockers.js ................ Blocker APIs
│   │   └── dashboard.js ............... Stats APIs
│   │
│   ├── .env ........................... Environment Config
│   └── package.json ................... Dependencies
│
└── README.md .......................... Documentation
```

## ⚡ COMMON COMMANDS

### Backend
```bash
cd backend
npm run dev           # Start development server
npm run init-db      # Initialize/reset database
npm start            # Start production server
```

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production build
npm run lint         # Run ESLint
```

## 🔑 Key Features Implemented

### Authentication
- ✓ Role-based login (Admin, Mentor, Intern)
- ✓ JWT token management
- ✓ Secure password hashing
- ✓ Protected API routes

### Admin Capabilities
- ✓ View all interns
- ✓ Manage intern-mentor assignments
- ✓ System-wide analytics
- ✓ Overall progress monitoring

### Mentor Capabilities
- ✓ View assigned interns
- ✓ Approve/reject daily reports
- ✓ Resolve blockers
- ✓ Add comments/feedback
- ✓ Track team progress

### Intern Capabilities
- ✓ View assigned tasks
- ✓ Submit daily reports
- ✓ Report blockers
- ✓ Track personal progress
- ✓ View mentor feedback

## 🐛 Troubleshooting

### Backend won't start
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Solution: Make sure PostgreSQL is running
```

### Frontend won't start
```
Error: Port 3000 already in use
Solution: Kill process on port 3000 or use different port: npm run dev -- -p 3001
```

### Database connection error
```
Error: role "postgres" does not exist
Solution: Check DATABASE_URL in .env, ensure PostgreSQL user exists
```

### API calls failing
```
Error: CORS error
Solution: Backend has CORS enabled. Check API_URL in frontend .env.local
```

## 📈 Next Features to Build

### Phase 6: Analytics & Blockers (Ready to implement)
- [ ] Advanced performance charts
- [ ] Blocker pattern analysis
- [ ] Custom report generation
- [ ] Performance predictions

### Phase 7: Notifications
- [ ] Email notifications
- [ ] In-app notification center
- [ ] WhatsApp integration

### Phase 8: Deployment
- [ ] Vercel (Frontend)
- [ ] Render/Railway (Backend)
- [ ] Supabase/Neon (Database)

## 📞 Support

If you face any issues:
1. Check the README.md for detailed documentation
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL and Node.js versions are compatible
4. Check backend console for error messages
5. Check browser console for frontend errors

---

**🎉 You're all set! Start building and tracking intern excellence.**

Go to: http://localhost:3000 to access the system.
