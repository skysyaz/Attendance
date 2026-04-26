# Staff Attendance App - Free Hosting Alternatives

## Frontend (React Native Web)

### Option 1: Vercel (Recommended - Free)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
cd frontend
vercel
```
- **Free**: Unlimited projects
- **SSL**: Automatic HTTPS
- **Custom domain**: Free

### Option 2: Netlify (Free)
```bash
# 1. Install Netlify CLI
npm i -g netlify-cli

# 2. Deploy
cd frontend/dist
netlify deploy --prod
```
- **Free**: 100GB bandwidth/month
- **SSL**: Automatic

### Option 3: Firebase Hosting (Free)
```bash
# 1. Install Firebase CLI
npm i -g firebase-tools

# 2. Initialize
firebase init hosting

# 3. Deploy
firebase deploy
```
- **Free**: 1GB storage, 10GB transfer/month

### Option 4: GitHub Pages (Free)
```bash
# Build for web first
cd frontend
yarn expo export --platform web

# Copy to docs folder and enable GitHub Pages
```

---

## Backend (Python FastAPI)

### Option 1: Render (Free)
1. Push code to GitHub
2. Connect GitHub to [render.com](https://render.com)
3. Select "Web Service"
4. Build command: `pip install -r requirements.txt`
5. Start command: `python server.py`
- **Free**: 750 hours/month, sleeps after 15 min inactivity

### Option 2: Railway
1. Connect GitHub to [railway.app](https://railway.app)
2. Deploy Python service
- **Free**: $5 credit/month

### Option 3: Fly.io (Free - Best for APIs)
```bash
# Install Fly CLI
brew install flyctl  # or curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```
- **Free**: 3 shared VMs, 160GB outbound

### Option 4: PythonAnywhere ($0/mo)
1. Sign up at [pythonanywhere.com](https://pythonanywhere.com)
2. Upload `server.py`
3. Set config → WSGI file
- **Free**: 1 web app, scheduled tasks

### Option 5: Cyclic (Free)
```bash
# Deploy backend directly from GitHub
# Connect repo at https://app.cyclic.io
```
- **Free**: 1 backend service

---

## Quick Deploy (Frontend + Backend)

### Easiest: Vercel + Render
1. **Frontend**: `vercel --prod` (Vercel)
2. **Backend**: Deploy to Render (connect GitHub)

### Update API URL:
Edit `/frontend/src/config/index.ts`:
```typescript
export const API_BASE_URL = 'https://your-backend.onrender.com';
```

---

## Complete Free Stack

| Component | Free Option | URL |
|-----------|------------|-----|
| Frontend Web | Vercel | your-app.vercel.app |
| Backend API | Render | your-api.onrender.com |
| Database | SQLite (file) or Neon (free tier) | neon.tech |