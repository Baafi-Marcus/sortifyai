# SortifyAI Deployment Guide

This guide covers deploying your SortifyAI application to production.

## Prerequisites

- Git repository (GitHub, GitLab, etc.)
- Domain name (optional but recommended)
- Deployment platform account (see options below)

## Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend) - Recommended

#### Frontend Deployment (Vercel)

1. **Prepare Frontend for Production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: `Vite`
     - Root Directory: `frontend`
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Add Environment Variables:
     - `VITE_API_URL`: Your backend URL (e.g., `https://your-app.onrender.com`)
   - Click "Deploy"

3. **Update Frontend API URL**
   - Create `frontend/.env.production`:
     ```env
     VITE_API_URL=https://your-backend-url.onrender.com
     ```
   - Update all `fetch("http://localhost:8000/...")` to `fetch(import.meta.env.VITE_API_URL + "/...")`

#### Backend Deployment (Render)

1. **Prepare Backend**
   - Create `render.yaml` in project root:
     ```yaml
     services:
       - type: web
         name: sortifyai-backend
         env: python
         buildCommand: "pip install -r backend/requirements.txt"
         startCommand: "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT"
         envVars:
           - key: OPENROUTER_API_KEYS
             sync: false
           - key: TWILIO_ACCOUNT_SID
             sync: false
           - key: TWILIO_AUTH_TOKEN
             sync: false
           - key: TWILIO_WHATSAPP_FROM
             sync: false
           - key: TWILIO_WHATSAPP_TO
             sync: false
     ```

2. **Deploy to Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `sortifyai-backend`
     - Environment: `Python 3`
     - Build Command: `pip install -r backend/requirements.txt`
     - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add Environment Variables (from your `.env` file)
   - Click "Create Web Service"

3. **Update CORS Settings**
   - In `backend/main.py`, update CORS origins:
     ```python
     app.add_middleware(
         CORSMiddleware,
         allow_origins=[
             "http://localhost:3000",
             "https://your-vercel-app.vercel.app",  # Add your Vercel URL
         ],
         allow_credentials=True,
         allow_methods=["*"],
         allow_headers=["*"],
     )
     ```

---

### Option 2: Railway (Full Stack)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   railway init
   railway up
   ```

3. **Deploy Frontend**
   ```bash
   cd ../frontend
   railway init
   railway up
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set OPENROUTER_API_KEYS=your-keys-here
   railway variables set VITE_API_URL=https://your-backend.railway.app
   ```

---

### Option 3: DigitalOcean App Platform

1. **Create `app.yaml`**
   ```yaml
   name: sortifyai
   services:
     - name: backend
       github:
         repo: your-username/sortifyai
         branch: main
         deploy_on_push: true
       source_dir: /backend
       run_command: uvicorn main:app --host 0.0.0.0 --port 8080
       envs:
         - key: OPENROUTER_API_KEYS
           scope: RUN_TIME
           type: SECRET
       http_port: 8080
       
     - name: frontend
       github:
         repo: your-username/sortifyai
         branch: main
         deploy_on_push: true
       source_dir: /frontend
       build_command: npm run build
       run_command: npm run preview
       envs:
         - key: VITE_API_URL
           value: ${backend.PUBLIC_URL}
       http_port: 4173
   ```

2. **Deploy**
   - Go to DigitalOcean → Apps
   - Click "Create App"
   - Upload `app.yaml`
   - Set environment variables
   - Deploy

---

### Option 4: Docker + Any Cloud Provider

1. **Create `backend/Dockerfile`**
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   EXPOSE 8000
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Create `frontend/Dockerfile`**
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **Create `frontend/nginx.conf`**
   ```nginx
   server {
       listen 80;
       server_name _;
       root /usr/share/nginx/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://backend:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **Create `docker-compose.yml`**
   ```yaml
   version: '3.8'
   services:
     backend:
       build: ./backend
       ports:
         - "8000:8000"
       environment:
         - OPENROUTER_API_KEYS=${OPENROUTER_API_KEYS}
         - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
         - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
       volumes:
         - ./backend/uploads:/app/uploads
         - ./backend/sortifyai_v2.db:/app/sortifyai_v2.db

     frontend:
       build: ./frontend
       ports:
         - "80:80"
       depends_on:
         - backend
   ```

5. **Deploy**
   ```bash
   docker-compose up -d
   ```

---

## Post-Deployment Checklist

### 1. Update API URLs
- [ ] Replace all `http://localhost:8000` with production backend URL
- [ ] Update CORS origins in `backend/main.py`

### 2. Environment Variables
- [ ] Set all API keys securely (never commit to Git)
- [ ] Configure Twilio credentials
- [ ] Set OpenRouter API keys

### 3. Database
- [ ] Use PostgreSQL for production (not SQLite)
- [ ] Set up database backups
- [ ] Run migrations if needed

### 4. Security
- [ ] Enable HTTPS (most platforms do this automatically)
- [ ] Set secure CORS origins
- [ ] Add rate limiting
- [ ] Validate file uploads (size, type)

### 5. Monitoring
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Monitor API usage
- [ ] Set up uptime monitoring

### 6. Performance
- [ ] Enable caching
- [ ] Optimize images
- [ ] Use CDN for static assets

---

## Quick Start (Recommended: Vercel + Render)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/sortifyai.git
   git push -u origin main
   ```

2. **Deploy Backend to Render**
   - Visit render.com → New Web Service
   - Connect GitHub repo
   - Root: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables
   - Deploy

3. **Deploy Frontend to Vercel**
   - Visit vercel.com → New Project
   - Import GitHub repo
   - Root: `frontend`
   - Framework: Vite
   - Add `VITE_API_URL` environment variable
   - Deploy

4. **Done!** 🎉

Your app is now live at:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.onrender.com`

---

## Troubleshooting

### CORS Errors
- Ensure backend CORS origins include your frontend URL
- Check that requests use the correct protocol (https)

### Database Issues
- SQLite doesn't work well on Render (use PostgreSQL)
- Ensure database file has write permissions

### File Upload Issues
- Check file size limits on your platform
- Ensure `/uploads` directory exists and is writable

### API Key Errors
- Verify environment variables are set correctly
- Check API key format (comma-separated for multiple keys)

---

## Cost Estimates

### Free Tier Options
- **Vercel**: Free for personal projects
- **Render**: Free tier available (sleeps after 15 min inactivity)
- **Railway**: $5/month credit

### Paid Options
- **Vercel Pro**: $20/month
- **Render**: $7/month per service
- **DigitalOcean**: $5-12/month
- **Railway**: Pay as you go

---

## Need Help?

- Check deployment logs for errors
- Review platform documentation
- Ensure all environment variables are set
- Test locally with production build first

Good luck with your deployment! 🚀
