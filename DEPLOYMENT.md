# 📦 DEPLOYMENT GUIDE - Topper IAS IMS

## 🌍 Production Deployment

This guide covers deploying the complete Intern Management System to production.

## Phase 1: Prepare for Deployment

### Frontend Deployment (Vercel)

#### Step 1: Prepare Frontend
```bash
cd frontend

# 1. Update environment for production
# Create .env.production.local
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api

# 2. Build and test locally
npm run build
npm start  # Test production build locally

# 3. Push to GitHub
git add .
git commit -m "Production ready frontend"
git push origin main
```

#### Step 2: Deploy to Vercel
```bash
# Option A: Using Vercel CLI
npm i -g vercel
vercel --prod

# Option B: Via Vercel Dashboard
# 1. Go to https://vercel.com
# 2. Import GitHub repository
# 3. Configure build settings:
#    - Framework: Next.js
#    - Build Command: npm run build
#    - Output Directory: .next
# 4. Add environment variables:
#    - NEXT_PUBLIC_API_URL: https://your-backend-api.com/api
# 5. Deploy
```

#### Vercel Configuration (vercel.json)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url"
  },
  "regions": ["blr1"]
}
```

### Backend Deployment (Render/Railway)

#### Step 1: Prepare Backend
```bash
cd backend

# 1. Update environment for production
# Create .env.production
PORT=8000
DATABASE_URL=postgresql://user:password@db-host:5432/ims_prod
JWT_SECRET=your_strong_secret_key_here_change_this
NODE_ENV=production

# 2. Test production build
npm run dev

# 3. Update package.json start script
# "start": "node index.js"

# 4. Push to GitHub
git add .
git commit -m "Backend production ready"
git push origin main
```

#### Deploy to Render
```
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - Name: topper-ims-backend
   - Environment: Node
   - Build Command: npm install
   - Start Command: npm start
5. Add Environment Variables:
   - DATABASE_URL: (see Database setup below)
   - JWT_SECRET: (generate strong key)
   - NODE_ENV: production
6. Deploy
```

#### Deploy to Railway
```
1. Go to https://railway.app
2. Connect GitHub account
3. Create New Project → GitHub Repo
4. Select backend repository
5. Add Variables:
   - DATABASE_URL
   - JWT_SECRET
   - NODE_ENV=production
6. Deploy
```

### Database Deployment (PostgreSQL)

#### Option 1: Supabase (Recommended)
```
1. Go to https://supabase.com
2. Create new project
3. Copy connection string (DATABASE_URL format)
4. Run schema initialization:
   - Copy content of backend/init-db.js
   - Execute in Supabase SQL editor
5. Create test users (see test-data.sql)
6. Update backend DATABASE_URL with Supabase connection string
```

#### Option 2: Neon
```
1. Go to https://neon.tech
2. Create new project
3. Copy connection string
4. Run schema initialization via SQL
5. Update backend with connection string
```

#### Option 3: AWS RDS
```
1. Create RDS PostgreSQL instance
2. Create database: ims_prod
3. Run schema initialization
4. Update security groups for backend access
5. Update DATABASE_URL
```

#### Initialize Production Database
```bash
# Run from your backend directory
PGPASSWORD=your_password psql \
  -h your-db-host \
  -U postgres \
  -d ims_prod \
  -f init-db.js

# Or manually execute SQL from init-db.js in DB admin console
```

## Phase 2: CORS & Security Configuration

### Update Backend CORS
```javascript
// backend/index.js
app.use(cors({
  origin: [
    'https://your-frontend-domain.com',
    'https://www.your-frontend-domain.com'
  ],
  credentials: true
}));
```

### Update Frontend API URL
```typescript
// frontend/.env.production.local
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
```

### Enable HTTPS
- Vercel: Automatic (included)
- Render/Railway: Automatic (included)
- Use Let's Encrypt for custom domains

## Phase 3: Environment Variables

### Backend Production .env
```
PORT=8000
DATABASE_URL=postgresql://user:pass@host:5432/ims_prod
JWT_SECRET=generate-long-random-string-with-special-chars!@#$%^&*()
NODE_ENV=production
```

### Generate Secure JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Phase 4: Testing in Production

### Test Backend API
```bash
# Health check
curl https://your-backend-api.com/api/health

# Test login
curl -X POST https://your-backend-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@topper.com","password":"admin123"}'
```

### Test Frontend
```
1. Open https://your-frontend-domain.com
2. Login with test credentials
3. Verify all dashboards load
4. Test API calls via browser DevTools
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Create load-test.yml
# Run test
artillery run load-test.yml
```

## Phase 5: Monitoring & Logging

### Render Logs
```
Dashboard → Your Service → Logs
```

### Vercel Analytics
```
Dashboard → Project Settings → Analytics
```

### Setup Error Tracking (Sentry)
```
1. Create Sentry account
2. Create project for backend
3. Install Sentry SDK:
   npm install @sentry/node
4. Initialize in backend/index.js
5. Initialize in frontend
```

### Database Monitoring
- Supabase: Built-in monitoring
- Neon: Built-in dashboard
- RDS: CloudWatch metrics

## Phase 6: Performance Optimization

### Frontend Optimization
```
✓ Enable Next.js Image Optimization
✓ Code splitting (automatic)
✓ CSS minification (automatic)
✓ JavaScript compression (automatic)
```

### Backend Optimization
```
✓ Add database indexes
✓ Implement caching (Redis optional)
✓ Use connection pooling
✓ Gzip compression
```

### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_reports_intern_date ON daily_reports(intern_id, report_date);
CREATE INDEX idx_blockers_status ON blockers(status, severity);
```

## Phase 7: CI/CD Pipeline

### GitHub Actions for Auto-Deploy

#### Frontend Deployment (.github/workflows/deploy-frontend.yml)
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

#### Backend Deployment (.github/workflows/deploy-backend.yml)
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: curl ${{ secrets.RENDER_DEPLOY_HOOK }}
```

## Phase 8: Maintenance & Backups

### Database Backups (Supabase Example)
```
1. Enable automatic daily backups in Supabase settings
2. Export backups monthly:
   Dashboard → Backups → Download
```

### Monitoring Checklist
- [ ] Daily log review
- [ ] Weekly performance metrics
- [ ] Monthly data backup verification
- [ ] Security updates applied
- [ ] CORS whitelist updated

### Update Production Safely
```bash
# 1. Create new branch
git checkout -b deploy-patch

# 2. Make minimal changes
# 3. Test thoroughly locally
# 4. Push to branch
# 5. Create PR with description
# 6. After approval, merge to main
# 7. Automated deployment triggers
```

## Troubleshooting Deployment

### Backend Connection Issues
```
✗ Problem: Backend can't connect to database
✓ Solution: Check DATABASE_URL format, verify IP whitelist in DB settings

✗ Problem: CORS errors on frontend
✓ Solution: Update CORS origins in backend index.js

✗ Problem: 502 Bad Gateway
✓ Solution: Check backend logs, verify all env variables set
```

### Frontend Issues
```
✗ Problem: API URL not working
✓ Solution: Verify NEXT_PUBLIC_API_URL in .env.production.local

✗ Problem: Blank page after deploy
✓ Solution: Clear browser cache, check build logs on Vercel

✗ Problem: API calls failing with 401
✓ Solution: JWT_SECRET changed? Regenerate tokens
```

### Database Issues
```
✗ Problem: Connection timeout
✓ Solution: Check connection string, verify database is running

✗ Problem: Queries very slow
✓ Solution: Check indexes exist, consider connection pooling
```

## DNS & Custom Domain

### Point Domain to Vercel (Frontend)
```
1. Your Domain Provider DNS Settings:
   - Add CNAME: your-domain.com → cname.vercel.app
   - Or A records provided by Vercel
2. Wait 24-48 hours for DNS propagation
3. Enable SSL in Vercel dashboard
```

### Point Domain to Render (Backend)
```
1. Render provides domain at deployment
2. For custom domain:
   - Go to Render Dashboard → Settings
   - Add custom domain
   - Update DNS CNAME
3. SSL automatically issued
```

## Performance Targets

| Metric | Target | Monitor |
|--------|--------|---------|
| FCP (Frontend) | < 1.5s | Vercel Analytics |
| API Response | < 200ms | Render/Railway Logs |
| DB Query | < 100ms | Database Admin |
| Uptime | > 99.9% | StatusPage.io |

## 🎉 Deployment Complete!

**Production URLs:**
- Frontend: https://your-frontend-domain.com
- Backend API: https://your-backend-api.com/api
- Database: Managed by provider

**Monitoring Dashboards:**
- Vercel: https://vercel.com/dashboard
- Render/Railway: Service Dashboard
- Database: Provider Admin Console

---

**Next:** Monitor performance, gather user feedback, plan Phase 6 analytics features.
