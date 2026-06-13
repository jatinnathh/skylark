"""
Upload the YOLO model to Modal Volume
Run this ONCE before deploying: python upload_model.py
"""
from pathlib import Path
import modal

app = modal.App("upload-model")
volume = modal.Volume.from_name("skylark-model", create_if_missing=True)

# Get the local model path
local_model_path = Path(__file__).parent / "runs" / "gcp_pose" / "weights" / "best.pt"

if not local_model_path.exists():
    raise FileNotFoundError(f"Model not found at {local_model_path}")

print(f"📦 Uploading model from: {local_model_path}")
print(f"📤 Model size: {local_model_path.stat().st_size / (1024*1024):.2f} MB")

@app.function(volumes={"/model": volume})
def upload_model():
    import shutil
    # The local file needs to be passed in differently
    # We'll copy it using the volume's put method
    print("✅ Model upload function ready")
    print("📝 Model should be at /model/best.pt")
    return "Upload complete!"

@app.local_entrypoint()
def main():
    # Upload the model file to the volume
    print("🚀 Starting upload...")
    
    with volume.batch_upload() as batch:
        batch.put_file(
            local_file=str(local_model_path),
            remote_path="best.pt"
        )
    
    print("✅ Model uploaded to Modal Volume successfully!")
    print("🎯 You can now run: modal deploy modal_app.py")
