# Skylark Deployment Guide - Vercel (Full Stack)

## Architecture
- **Frontend**: Next.js app on Vercel
- **Backend**: FastAPI + YOLO model on Vercel Python runtime
- **Model**: 20 MB fine-tuned YOLO pose detection model

## Prerequisites
1. Vercel account
2. GitHub repository
3. Model file tracked in git (not ignored)

## Deployment Steps

### 1. Add the model to git
```bash
# The model is now allowed in .gitignore
git add backend/runs/gcp_pose/weights/best.pt
git add api/
git commit -m "Add API and model for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Using Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect Next.js
4. Deploy

**Option B: Using Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 3. Test the Deployment

Check health endpoint:
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_path": "/var/task/backend/runs/gcp_pose/weights/best.pt",
  "model_exists": true
}
```

Test prediction:
```bash
curl -X POST https://your-app.vercel.app/api/predict \
  -F "file=@test-image.jpg"
```

## Local Development

### Run the API locally:
```bash
cd api
pip install -r requirements.txt
uvicorn index:app --reload
```

### Run the Next.js frontend:
```bash
npm install
npm run dev
```

Visit: http://localhost:3000

## Troubleshooting

### If deployment fails with size limit:
Vercel has a 50 MB limit for serverless functions. If you hit this:
- Dependencies (PyTorch + Ultralytics) are compressed during deployment
- Your 20 MB model should fit within limits
- If it exceeds, consider Modal as a fallback (see DEPLOYMENT_MODAL.md)

### If inference is slow:
- First deployment (cold start) may take 5-10 seconds
- Subsequent requests are faster (warm container)
- If consistently slow, consider Modal for GPU acceleration

### If you see "Model not loaded":
- Check that best.pt is in your git repository
- Verify the file path in the health endpoint response
- Ensure .gitignore allows the model file

## Performance Expectations
- **Cold start**: 5-15 seconds (first request after idle)
- **Warm requests**: 2-5 seconds (subsequent requests)
- **Timeout limit**: 10 seconds (Vercel Hobby), 60 seconds (Pro)

If you need faster inference or GPU support, switch to Modal deployment.
