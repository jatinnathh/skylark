FROM python:3.11-slim

# Install system dependencies including libGL for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0t64 \
    libgl1 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install CPU-only PyTorch FIRST (avoids pulling 2GB of CUDA libs)
RUN pip install --no-cache-dir \
    torch torchvision \
    --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the model weights
COPY best.pt .

# Copy the application
COPY app.py .

# HF Spaces requires port 7860
EXPOSE 7860

# Run the FastAPI server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
