# 🚀 Quick Start - Deploy in 5 Minutes

## What Happened?
Vercel rejected PyTorch (5.3 GB > 500 MB limit). Solution: Deploy ML on Modal instead.

## Deploy Now

### 1. Install & Setup Modal (30 seconds)
```bash
pip install modal
modal token new
```

### 2. Deploy ML Backend to Modal (1 minute)
```bash
cd backend
modal deploy modal_app.py
```
**Copy the URL** from output (e.g., `https://yourorg--skylark-pose-engine-fastapi-app.modal.run`)

### 3. Commit Changes (30 seconds)
```bash
git add api/ backend/modal_app.py vercel.json
git commit -m "Setup Modal + Vercel hybrid deployment"
git push origin main
```

### 4. Deploy to Vercel (2 minutes)

**Vercel Dashboard** (easiest):
1. Go to https://vercel.com/new
2. Import your repo
3. Add environment variable:
   - **Name**: `MODAL_API_URL`
   - **Value**: `<your-modal-url>`
4. Click Deploy

**OR Vercel CLI**:
```bash
vercel env add MODAL_API_URL production
# Paste your Modal URL when prompted
vercel --prod
```

### 5. Test It! (30 seconds)
```bash
# Health check
curl https://your-app.vercel.app/api/health

# Prediction
curl -X POST https://your-app.vercel.app/api/predict \
  -F "file=@test.jpg"
```

## Done! 🎉

Your app is live:
- Frontend: Vercel
- ML Backend: Modal
- Total time: ~5 minutes

See `DEPLOY_GUIDE.md` for detailed troubleshooting.
