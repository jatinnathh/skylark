"""
Simple Modal deployment - includes model file via image.add_local_dir()
Place this file and the model in the same project structure
"""
import io
import base64
import modal
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = modal.App("skylark-pose-engine")

# Build image with dependencies and copy the entire backend directory
# This will include runs/gcp_pose/weights/best.pt
image = (
    modal.Image.debian_slim()
    .pip_install(
        "ultralytics",
        "opencv-python-headless",
        "torch",
        "torchvision",
        "Pillow",
        "fastapi",
        "python-multipart"
    )
    .add_local_dir(
        local_path=".",
        remote_path="/app"
    )
)

web_app = FastAPI()
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLASS_NAMES = ['Cross', 'Square', 'L-Shape']

@app.function(image=image)
@modal.asgi_app()
def serve():
    from ultralytics import YOLO
    from PIL import Image, ImageDraw
    
    # Model path inside the container
    model = YOLO("/app/runs/gcp_pose/weights/best.pt")
    
    @web_app.get("/health")
    async def health():
        return {"status": "healthy", "model_loaded": True}
    
    @web_app.post("/predict")
    async def predict(file: UploadFile = File(...)):
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert('RGB')
        W, H = img.size
        draw = ImageDraw.Draw(img)
        
        window_size = int(max(W, H) * 0.35)
        stride = window_size // 2
        best_conf = 0.0
        best_kp = None
        best_box = None
        best_cls = -1
        
        for y0 in range(0, H, stride):
            for x0 in range(0, W, stride):
                x1 = min(x0 + window_size, W)
                y1 = min(y0 + window_size, H)
                
                if x1 - x0 < window_size:
                    x0 = max(0, W - window_size)
                    x1 = W
                if y1 - y0 < window_size:
                    y0 = max(0, H - window_size)
                    y1 = H
                
                crop_img = img.crop((x0, y0, x1, y1))
                res_crop = model(crop_img, conf=0.005, imgsz=640, verbose=False)[0]
                
                if res_crop.keypoints is not None and len(res_crop.keypoints.xy) > 0:
                    idx_c = int(res_crop.boxes.conf.argmax())
                    conf_c = float(res_crop.boxes.conf[idx_c])
                    
                    if conf_c > best_conf:
                        best_conf = conf_c
                        best_cls = int(res_crop.boxes.cls[idx_c])
                        kp = res_crop.keypoints.xy[idx_c][0]
                        best_kp = (float(kp[0]) + x0, float(kp[1]) + y0)
                        
                        box_c = res_crop.boxes.xyxy[idx_c]
                        cx0, cy0, cx1, cy1 = [float(v) for v in box_c.tolist()]
                        best_box = (cx0 + x0, cy0 + y0, cx1 + x0, cy1 + y0)
                
                if x1 == W:
                    break
            if y1 == H:
                break
        
        pred_x, pred_y, pred_cls, conf = None, None, -1, 0.0
        status = 'NODET'
        pred_name = 'NOT DETECTED'
        
        if best_conf > 0.0:
            conf = best_conf
            pred_x, pred_y = best_kp
            pred_cls = best_cls
            status = 'DET'
            pred_name = CLASS_NAMES[pred_cls]
            
            bx0, by0, bx1, by1 = [int(v) for v in best_box]
            draw.rectangle([bx0, by0, bx1, by1], outline='red', width=3)
            
            marker_size = max(15, int(min(W, H) * 0.008))
            line_width = max(3, marker_size // 4)
            px, py = int(pred_x), int(pred_y)
            draw.line([(px - marker_size, py - marker_size), (px + marker_size, py + marker_size)], fill='red', width=line_width)
            draw.line([(px - marker_size, py + marker_size), (px + marker_size, py - marker_size)], fill='red', width=line_width)
        
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=85)
        img_b64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
        
        return {
            "status": status,
            "x": pred_x,
            "y": pred_y,
            "confidence": conf,
            "class": pred_name,
            "image_b64": img_b64
        }
    
    return web_app
