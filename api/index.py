import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hugging Face Space backend URL
HF_SPACE_URL = os.environ.get(
    "HF_SPACE_URL", "https://jatinnath-skylark-gcp.hf.space"
)


@app.get("/api/health")
async def health():
    """Health check — also pings the HF Space backend."""
    hf_status = "not_configured"

    if HF_SPACE_URL:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(HF_SPACE_URL)
                hf_status = "healthy" if response.status_code == 200 else "unhealthy"
        except Exception:
            hf_status = "unreachable"

    return {
        "status": "healthy",
        "hf_space_configured": bool(HF_SPACE_URL),
        "hf_space_status": hf_status,
        "hf_space_url": HF_SPACE_URL,
    }


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    """Proxy prediction requests to the Hugging Face Space backend."""
    if not HF_SPACE_URL:
        raise HTTPException(
            status_code=503,
            detail="HF_SPACE_URL environment variable not configured.",
        )

    contents = await file.read()

    async with httpx.AsyncClient(timeout=180.0) as client:
        try:
            response = await client.post(
                f"{HF_SPACE_URL}/predict",
                files={"file": (file.filename, contents, file.content_type)},
            )
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=504,
                detail="HF Space request timed out. The Space may be cold-starting — try again in 30s.",
            )
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Error communicating with HF Space: {str(e)}",
            )
