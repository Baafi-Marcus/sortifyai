# 🚀 SortifyAI Deployment Guide (Vercel + Render)

Deploy your app in **3 simple steps** (~10 minutes total)

---

## ✅ Prerequisites

- GitHub account
- Git installed on your PC
- Your API keys ready (OpenRouter, Twilio)

---

## 📦 Step 1: Push to GitHub (5 min)

### 1.1 Create GitHub Repository

1. Go to [github.com](https://github.com) and login
2. Click **"+"** → **"New repository"**
3. Name it: `sortifyai`
4. Keep it **Public** (or Private if you have Pro)
5. **Don't** initialize with README
6. Click **"Create repository"**

### 1.2 Push Your Code

Open PowerShell in your project folder and run:

```bash
cd c:\Users\RIGHTEOUS\Desktop\SORTIFYAI

# Initialize git
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Connect to GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/BAAFI_MARCUS/sortifyai.git
git push -u origin main
```

**✅ Done!** Your code is now on GitHub.

---

## 🔧 Step 2: Deploy Backend to Render (3 min)

### 2.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started"** → Sign up with GitHub
3. Authorize Render to access your repositories

### 2.2 Deploy Backend

1. Click **"New +"** → **"Web Service"**
2. Select your `sortifyai` repository
3. Configure:
   - **Name**: `sortifyai-backend`
   - **Region**: Choose closest to you
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

4. Click **"Advanced"** → Add Environment Variables:
   ```
   OPENROUTER_API_KEYS = your-keys-here (comma-separated)
   TWILIO_ACCOUNT_SID = your-sid
   TWILIO_AUTH_TOKEN = your-token
   TWILIO_WHATSAPP_FROM = whatsapp:+14155238886
   TWILIO_WHATSAPP_TO = whatsapp:+your-number
   ```

5. Click **"Create Web Service"**

6. **Wait 3-5 minutes** for deployment to complete

7. **Copy your backend URL** (e.g., ` https://sortifyai-backend.onrender.com`)

**✅ Backend is live!**

---

## 🎨 Step 3: Deploy Frontend to Vercel (2 min)

### 3.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → Sign up with GitHub
3. Authorize Vercel

### 3.2 Deploy Frontend

1. Click **"Add New..."** → **"Project"**
2. Import your `sortifyai` repository
3. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Click **"Environment Variables"** → Add:
   ```
   VITE_API_URL = https://sortifyai-backend.onrender.com
   ```
   (Use YOUR backend URL from Step 2.2.7)

5. Click **"Deploy"**

6. **Wait 2-3 minutes** for deployment

7. **Your app is live!** Click the URL to visit it

**✅ Frontend is live!**

---

## 🔄 Step 4: Update CORS (1 min)

Your frontend can't talk to backend yet. Let's fix that:

### 4.1 Update Backend CORS

1. Open `backend/main.py`
2. Find the `CORSMiddleware` section (around line 30)
3. Add your Vercel URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app",  # ← Add your Vercel URL here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4.2 Push Update

```bash
git add .
git commit -m "Update CORS for production"
git push
```

**Render will auto-redeploy in ~2 minutes!**

---

## 🎉 You're Done!

Your app is now live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://sortifyai-backend.onrender.com`

---

## 📝 Important Notes

### Free Tier Limitations

**Render Free Tier:**
- Backend sleeps after 15 min of inactivity
- First request after sleep takes ~30 seconds to wake up
- **Solution**: Upgrade to $7/month for always-on

**Vercel Free Tier:**
- No limitations for personal projects
- Unlimited bandwidth and deployments

### Auto-Deploy

Both platforms auto-deploy when you push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push
```

Wait 2-3 minutes and your changes are live!

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- Check CORS settings in `backend/main.py`
- Verify `VITE_API_URL` in Vercel environment variables
- Redeploy frontend after changes

### Backend errors
- Check logs in Render dashboard
- Verify all environment variables are set
- Check if API keys are valid

### Database issues
- Render free tier uses ephemeral storage
- Database resets when backend sleeps
- **Solution**: Use PostgreSQL (free tier available)

---

## 🔄 Making Updates

1. Make changes locally
2. Test locally:
   ```bash
   # Backend
   cd backend
   uvicorn main:app --reload

   # Frontend (new terminal)
   cd frontend
   npm run dev
   ```
3. Push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
4. Wait for auto-deploy (2-3 min)

---

## 💰 Cost Summary

| Service | Free Tier | Paid Option |
|---------|-----------|-------------|
| Vercel | ✅ Unlimited | $20/month (Pro) |
| Render | ✅ 750 hours/month | $7/month (always-on) |
| **Total** | **$0/month** | **$7/month** |

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- Check deployment logs for errors
- Verify environment variables are set correctly

---

**Happy deploying! 🚀**
