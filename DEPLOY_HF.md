# Deploying Skylark — Hugging Face Spaces + Vercel

## Architecture

```
User → Vercel (Next.js frontend) → Vercel Serverless (Python proxy) → HF Space (FastAPI + YOLO)
```

---

## Step 1: Deploy the Model on Hugging Face Spaces

### 1a. Create the Space

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. Fill in:
   - **Owner**: `Jatinnath`
   - **Space name**: `skylark-gcp`
   - **SDK**: Select **Docker**
   - **Visibility**: Public (required for free tier API access)
   - **Hardware**: CPU Basic (Free)
3. Click **Create Space**

### 1b. Push Files to the Space

The Space repo will be at: `https://huggingface.co/spaces/Jatinnath/skylark-gcp`

**Option A: Via Git (recommended)**

```bash
# Clone the empty Space repo
git lfs install
git clone https://huggingface.co/spaces/Jatinnath/skylark-gcp
cd skylark-gcp

# Copy files from the hf_space/ folder
cp ../path/to/skylark/hf_space/* .

# Push (Git LFS handles the 20MB .pt file automatically)
git add .
git commit -m "Initial deployment: FastAPI + YOLO pose detection"
git push
```

**Option B: Via HF Web UI**

1. Go to your Space's **Files** tab
2. Click **Add file → Upload files**
3. Upload these 4 files from the `hf_space/` folder:
   - `Dockerfile`
   - `app.py`
   - `requirements.txt`
   - `best.pt` (20MB)
4. Commit the changes

### 1c. Verify the Space

After pushing, HF will auto-build the Docker image (~5-10 min for first build).

- Watch the build logs at: `https://huggingface.co/spaces/Jatinnath/skylark-gcp`
- Once running, test the health endpoint:
  ```
  https://jatinnath-skylark-gcp.hf.space/
  ```
  Should return: `{"status": "healthy", "model_loaded": true, ...}`

- Test prediction:
  ```bash
  curl -X POST -F "file=@your_image.jpg" https://jatinnath-skylark-gcp.hf.space/predict
  ```

> **Note**: Free HF Spaces go to sleep after 48h of inactivity. First request after sleep takes ~2-3 minutes to cold-start. This is normal.

---

## Step 2: Deploy Frontend + Proxy on Vercel

### 2a. Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `skylark` GitHub repo
3. Vercel will auto-detect it as a Next.js project

### 2b. Set Environment Variable

In Vercel project settings → **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `HF_SPACE_URL` | `https://jatinnath-skylark-gcp.hf.space` |

### 2c. Deploy

Click **Deploy**. Vercel will:
- Build the Next.js frontend
- Deploy the Python serverless function at `/api/*`
- The proxy forwards requests to your HF Space

### 2d. Verify

1. Visit your Vercel URL
2. Upload a sample image or click a sample thumbnail
3. Click "Run GCP detection"
4. You should see the annotated result with bounding box and keypoint

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| HF Space build fails | Check build logs at HF Space page. Most common: missing system deps (already handled in Dockerfile) |
| 504 Timeout on first request | HF Space is cold-starting. Wait 2-3 min and retry |
| "HF_SPACE_URL not configured" | Add the env var in Vercel project settings and redeploy |
| CORS errors | Both the HF Space and Vercel proxy have CORS fully enabled — shouldn't happen |
| Space goes to sleep | Normal for free tier. First request wakes it up (~2-3 min). Consider upgrading to "persistent" Space if needed |

---

## File Reference

| File | Purpose |
|------|---------|
| `hf_space/Dockerfile` | Docker image for HF Space |
| `hf_space/app.py` | FastAPI inference server with YOLO |
| `hf_space/requirements.txt` | Python dependencies |
| `hf_space/best.pt` | Trained YOLO model (20MB) |
| `api/index.py` | Vercel serverless proxy to HF Space |
| `vercel.json` | Vercel routing config |
| `next.config.ts` | Next.js config (dev proxy) |
