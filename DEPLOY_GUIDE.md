# 🚀 Skylark Deployment Guide - Hybrid Architecture

## ❌ What Happened

Vercel deployment failed with:
```
Bundle size (5356.32 MB) exceeds Lambda ephemeral storage limit (500 MB)
```

**Root cause**: PyTorch + dependencies = 5.3 GB (too large for Vercel serverless)

## ✅ Solution: Hybrid Deployment

- **Frontend**: Next.js on Vercel
- **API Proxy**: Lightweight FastAPI on Vercel (proxies requests)
- **ML Backend**: FastAPI + YOLO on Modal (handles inference)

## 📋 Deployment Steps

### Step 1: Deploy ML Backend to Modal

#### 1.1 Install Modal
```bash
pip install modal
```

#### 1.2 Authenticate
```bash
modal token new
```

This opens a browser for authentication.

#### 1.3 Deploy the Backend
```bash
cd backend
modal deploy modal_app.py
```

**Expected output:**
```
✓ Created objects.
├── 🔨 Created mount /Users/.../backend/runs/gcp_pose/weights/best.pt
├── 🔨 Created skylark-pose-engine::fastapi_app
└── 🔨 Created web function => https://yourorg--skylark-pose-engine-fastapi-app.modal.run
```

**Copy the URL** - you'll need it for Step 2.

Example: `https://yourorg--skylark-pose-engine-fastapi-app.modal.run`

---

### Step 2: Deploy Frontend + Proxy to Vercel

#### 2.1 Commit Your Changes
```bash
git add api/
git add backend/modal_app.py
git add vercel.json
git commit -m "Setup hybrid deployment: Vercel + Modal"
git push origin main
```

#### 2.2 Deploy to Vercel

**Option A: Vercel Dashboard** (Recommended)
1. Go to https://vercel.com/new
2. Import `jatinnathh/skylark` from GitHub
3. Before clicking "Deploy", add environment variable:
   - **Key**: `MODAL_API_URL`
   - **Value**: `https://yourorg--skylark-pose-engine-fastapi-app.modal.run` (from Step 1.3)
4. Click "Deploy"

**Option B: Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Set environment variable
vercel env add MODAL_API_URL production
# Paste your Modal URL when prompted

# Deploy
vercel --prod
```

---

### Step 3: Test Your Deployment

#### 3.1 Test Modal Backend Directly
```bash
curl https://yourorg--skylark-pose-engine-fastapi-app.modal.run/health
```

Expected:
```json
{"status": "healthy", "model_loaded": true}
```

#### 3.2 Test Vercel API Health
```bash
curl https://your-app.vercel.app/api/health
```

Expected:
```json
{
  "status": "healthy",
  "modal_configured": true,
  "modal_status": "healthy",
  "modal_url": "https://yourorg--skylark-pose-engine-fastapi-app.modal.run"
}
```

#### 3.3 Test Full Prediction
```bash
curl -X POST https://your-app.vercel.app/api/predict \
  -F "file=@test-image.jpg" \
  -o response.json

cat response.json
```

Expected:
```json
{
  "status": "DET",
  "x": 1234.5,
  "y": 2345.6,
  "confidence": 0.95,
  "class": "Cross",
  "image_b64": "..."
}
```

---

## 🏗️ Architecture Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────┐
│  Vercel                     │
│  ┌─────────────────────┐   │
│  │  Next.js Frontend   │   │
│  └─────────────────────┘   │
│            ↓                │
│  ┌─────────────────────┐   │
│  │  FastAPI Proxy      │   │
│  │  (api/index.py)     │   │
│  │  Size: ~5 MB        │   │
│  └──────────┬──────────┘   │
└─────────────┼───────────────┘
              │ HTTP Request
              ↓
┌─────────────────────────────┐
│  Modal                      │
│  ┌─────────────────────┐   │
│  │  FastAPI Backend    │   │
│  │  + YOLO Model       │   │
│  │  (modal_app.py)     │   │
│  │  Size: 5.3 GB       │   │
│  │  GPU: Optional      │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

---

## 📊 Performance Expectations

### Modal Backend (First Request)
- **Cold start**: 10-20 seconds (loading model)
- **After warm-up**: 2-5 seconds (CPU) or <1 second (GPU)

### Modal Backend (Subsequent Requests)
- **Warm container**: 2-5 seconds
- Modal keeps containers warm for ~10 minutes

### Vercel Frontend + Proxy
- **Cold start**: 1-2 seconds
- **Warm requests**: <500ms (just proxying)

---

## 💰 Cost Estimates

### Modal Free Tier
- **$30/month** in free credits
- CPU inference: ~$0.001 per prediction
- GPU inference (if enabled): ~$0.01 per prediction
- Free tier = ~30,000 CPU predictions/month

### Vercel Free Tier
- Unlimited requests
- 100 GB bandwidth
- Sufficient for most use cases

---

## 🔧 Troubleshooting

### Issue 1: "MODAL_API_URL not configured"
**Solution**: Add environment variable in Vercel
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add: `MODAL_API_URL` = `https://your-modal-url.modal.run`
3. Redeploy: `vercel --prod`

### Issue 2: Modal returns 404
**Check**: Is your Modal app deployed?
```bash
modal app list
# Should show: skylark-pose-engine
```

**Redeploy if needed**:
```bash
cd backend
modal deploy modal_app.py
```

### Issue 3: "Model not found" on Modal
**Check**: Is the model file in the correct location?
```bash
ls backend/runs/gcp_pose/weights/best.pt
```

**Fix**: Update `modal_app.py` if path is wrong

### Issue 4: Slow first request
**Explanation**: Modal cold start (loading PyTorch + model)
**Solution**: First request takes 10-20 seconds, then it's fast
**Workaround**: Keep warm with periodic health checks

---

## 🎯 Next Steps

### Optional: Enable GPU Acceleration
Edit `backend/modal_app.py`:
```python
@app.function(
    image=image,
    mounts=[modal.Mount.from_local_file(local_weights_path, remote_path="/weights/best.pt")],
    gpu="T4"  # Add this line
)
```

Then redeploy:
```bash
modal deploy modal_app.py
```

### Optional: Keep Modal Warm
Create a cron job to ping `/health` every 5 minutes:
```bash
# In Vercel: Set up a serverless function or use GitHub Actions
curl https://yourorg--skylark-pose-engine-fastapi-app.modal.run/health
```

---

## ✅ Success Checklist

- [ ] Modal backend deployed and returning 200 on `/health`
- [ ] Vercel app deployed successfully
- [ ] `MODAL_API_URL` environment variable set in Vercel
- [ ] `/api/health` shows `modal_status: "healthy"`
- [ ] `/api/predict` returns predictions successfully
- [ ] Frontend can upload images and display results

---

## 📚 Additional Resources

- [Modal Documentation](https://modal.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [FastAPI CORS Guide](https://fastapi.tiangolo.com/tutorial/cors/)

---

**You're all set!** This hybrid architecture gives you:
✅ Unlimited model size (no Vercel limits)
✅ Fast inference (GPU optional on Modal)
✅ Scalable (Modal auto-scales)
✅ Cost-effective (pay per use)
