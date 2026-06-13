# 🚀 Ready to Deploy to Vercel

## ✅ What's Been Fixed

1. **API endpoint** (`api/index.py`) - Full FastAPI backend with YOLO inference
2. **Model path** - Now uses relative path (works on Vercel)
3. **Dependencies** (`api/requirements.txt`) - All ML libraries included
4. **Model file** - Force-added to git (bypasses .gitignore)
5. **Vercel config** (`vercel.json`) - Configured for Python backend

## 📦 Current Status

The model file is staged and ready:
```bash
git status
# Shows: backend/runs/gcp_pose/weights/best.pt (19 MB)
```

## 🎯 Next Steps

### 1. Commit and Push
```bash
git add api/
git add vercel.json
git add .gitignore
git commit -m "Deploy full ML backend to Vercel"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Vercel Dashboard** (Recommended)
1. Visit https://vercel.com/new
2. Import your GitHub repository `jatinnathh/skylark`
3. Click "Deploy"
4. Wait 2-3 minutes for build to complete

**Option B: Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 3. Test Your Deployment

After deployment completes, test the health endpoint:
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_path": "...",
  "model_exists": true
}
```

### 4. Test Inference

Upload an image to test predictions:
```bash
curl -X POST https://your-app.vercel.app/api/predict \
  -F "file=@path/to/test-image.jpg" \
  -o response.json
```

## ⚠️ If Deployment Fails

### Common Issues:

**1. Size Limit Exceeded (> 50 MB)**
- Check build logs for actual size
- PyTorch will be compressed during build
- If still too large, we'll need Modal (fallback plan ready)

**2. Timeout During Build**
- Vercel may need to install PyTorch (takes time on first build)
- Subsequent builds are cached and faster
- If it times out, try deploying again

**3. Model Not Found**
- Check if best.pt is in the repository
- Run: `git ls-files | grep best.pt`
- Should show: `backend/runs/gcp_pose/weights/best.pt`

## 🔄 Fallback: Modal Deployment

If Vercel doesn't work due to size/performance limits, we have Modal deployment ready:
```bash
cd backend
modal deploy modal_app.py
```

Then update Vercel environment variable:
- `MODAL_API_URL` = `<modal-url>`

## 📊 Expected Performance

**On Vercel:**
- Cold start: 5-15 seconds
- Warm requests: 2-5 seconds
- CPU inference only
- 10-60 second timeout (depending on plan)

**If you need faster/GPU:**
- Switch to Modal deployment
- Get sub-second inference with GPU

## ✨ What You Get

✅ Full-stack deployment on Vercel
✅ Next.js frontend + Python backend
✅ YOLO model served directly
✅ No external dependencies needed
✅ Simple architecture (one platform)

Try it now! If you hit limits, Modal is ready as backup.
