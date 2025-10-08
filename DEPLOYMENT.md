# 🚀 Production Deployment Guide

This guide covers deploying the Vehicle Tracking Management System to production using Vercel, Render, and Neon.

**Last updated:** October 8, 2025 - All API URLs fixed for production deployment.

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier available)
- Render account (free tier available)
- Neon account (free PostgreSQL hosting)

## 🗄️ Step 1: Set Up PostgreSQL Database on Neon

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Note down the connection string: `postgresql://username:password@hostname/database`
4. Run the database schema:
   ```sql
   -- Copy the contents of backend/database/init.sql and run in Neon SQL editor
   ```

## 🤖 Step 2: Deploy ML Service to Render

1. Go to [render.com](https://render.com) and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository (see Step 3 for repo setup)
4. Configure:
   - **Name**: `vehicle-tracking-ml-service`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Add environment variable:
   - `PORT`: `8000`
6. Deploy

## 🖥️ Step 3: Deploy Backend to Render

1. In Render dashboard, click "New" → "Web Service"
2. Connect GitHub repo
3. Configure:
   - **Name**: `vehicle-tracking-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `your_neon_connection_string`
   - `JWT_SECRET`: `generate_a_random_secret`
   - `ML_SERVICE_URL`: `https://your-ml-service.onrender.com`
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`
5. Deploy

## 🌐 Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variable:
   - `VITE_API_URL`: `https://your-backend.onrender.com`
6. Deploy

## 🔧 Step 5: Update Environment Variables

After all services are deployed, update the URLs:

### Backend (Render)
- `FRONTEND_URL`: `https://your-project.vercel.app`
- `ML_SERVICE_URL`: `https://your-ml-service.onrender.com`

### Frontend (Vercel)
- `VITE_API_URL`: `https://your-backend.onrender.com`

## 🧪 Step 6: Test Deployment

1. Visit your Vercel frontend URL
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`
3. Test all features

## 📁 Project Structure for GitHub

```
vehicle-tracking-system/
├── backend/          # Node.js API
├── frontend/         # React PWA
├── ml-service/       # Python FastAPI
├── mobile/           # React Native app
├── electron/         # Desktop app
├── docs/             # Documentation
├── DEPLOYMENT.md     # Production guide
└── README.md         # Project overview
```

## 🚀 GitHub Setup Instructions

1. Create a new repository on GitHub
2. Initialize git in your project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```
3. For auto-deployment:
   - Connect the repo to Vercel, Render services
   - Enable auto-deploy on push to main branch

## 🔒 Security Notes

- Never commit `.env` files with real secrets
- Use environment variables for all sensitive data
- Enable HTTPS (automatically handled by Vercel/Render)
- Regularly rotate JWT secrets

## 💰 Cost Estimates

- **Vercel**: Free for personal projects
- **Render**: Free tier (750 hours/month)
- **Neon**: Free tier (512MB storage)

## 🐛 Troubleshooting

### CORS Issues
- Ensure `FRONTEND_URL` in backend matches Vercel URL
- Check CORS settings in backend

### Database Connection
- Verify Neon connection string
- Check SSL settings in db.js

### API Calls Failing
- Confirm `VITE_API_URL` in frontend matches Render backend URL
- Check browser network tab for errors

### Authentication Issues
- Clear localStorage and re-login on production
- Ensure JWT_SECRET is set in production

## 📞 Support

If you encounter issues:
1. Check Render/Vercel/Neon logs
2. Verify environment variables
3. Test locally with production env vars
4. Check network connectivity between services