"""
Run model on all 600 test images and save annotated images with predictions.
No ground truth available — only shows model predictions.
"""
import json
from pathlib import Path
from ultralytics import YOLO
from PIL import Image, ImageDraw, ImageFont

MODEL_PATH = r'C:\Users\Jatin\Desktop\skylark\backend\runs\gcp_pose\weights\best.pt'
TEST_ROOT = Path(r'C:\Users\Jatin\Desktop\skylark\data\GCP_Assignment_Datasets\test_dataset')
OUTPUT_DIR = Path(r'C:\Users\Jatin\Desktop\skylark\backend\testimage')
OUTPUT_DIR.mkdir(exist_ok=True)

CLASS_NAMES = ['Cross', 'Square', 'L-Shape']
model = YOLO(MODEL_PATH)

# Collect all test images
test_images = sorted(list(set(list(TEST_ROOT.rglob('*.JPG')) + list(TEST_ROOT.rglob('*.jpg')) + list(TEST_ROOT.rglob('*.png')))))
print(f'Total test images: {len(test_images)}')

detected_count = 0
predictions_dict = {}

for i, img_path in enumerate(test_images):
    img = Image.open(img_path).convert('RGB')
    W, H = img.size
    draw = ImageDraw.Draw(img)

    window_size = int(max(W, H) * 0.35)  # roughly 1400x1400 window for a 4000x3000 image
    stride = window_size // 2  # 50% overlap

    best_conf = 0.0
    best_kp = None
    best_box = None
    best_cls = -1

    # Sliding window (CNN-like) approach over the full image
    for y0 in range(0, H, stride):
        for x0 in range(0, W, stride):
            x1 = min(x0 + window_size, W)
            y1 = min(y0 + window_size, H)
            
            # Ensure window is exactly window_size if possible to maintain consistent scale
            if x1 - x0 < window_size:
                x0 = max(0, W - window_size)
                x1 = W
            if y1 - y0 < window_size:
                y0 = max(0, H - window_size)
                y1 = H
                
            crop_img = img.crop((x0, y0, x1, y1))
            
            # Run prediction on the sliding window crop
            # Using a lower confidence threshold to ensure we catch everything, picking the absolute max later
            res_crop = model(crop_img, conf=0.005, imgsz=640, verbose=False)[0]
            
            if res_crop.keypoints is not None and len(res_crop.keypoints.xy) > 0:
                # Find the best detection inside this crop
                idx_c = int(res_crop.boxes.conf.argmax())
                conf_c = float(res_crop.boxes.conf[idx_c])
                
                # If this crop yields a higher confidence than any other crop so far
                if conf_c > best_conf:
                    best_conf = conf_c
                    best_cls = int(res_crop.boxes.cls[idx_c])
                    kp = res_crop.keypoints.xy[idx_c][0]
                    # Map coordinates back to full image
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

    if best_conf > 0.0:
        conf = best_conf
        pred_x, pred_y = best_kp
        pred_cls = best_cls
        detected_count += 1
        status = 'DET'

        rel_path = str(img_path.relative_to(TEST_ROOT)).replace('\\', '/')
        predictions_dict[rel_path] = {
            "mark": {
                "x": pred_x,
                "y": pred_y
            },
            "verified_shape": CLASS_NAMES[pred_cls]
        }

        # Draw bounding box
        bx0, by0, bx1, by1 = [int(v) for v in best_box]
        draw.rectangle([bx0, by0, bx1, by1], outline='red', width=3)

        # Draw predicted keypoint — red X
        marker_size = max(15, int(min(W, H) * 0.008))
        line_width = max(3, marker_size // 4)
        px, py = int(pred_x), int(pred_y)
        draw.line([(px - marker_size, py - marker_size), (px + marker_size, py + marker_size)], fill='red', width=line_width)
        draw.line([(px - marker_size, py + marker_size), (px + marker_size, py - marker_size)], fill='red', width=line_width)

    # Draw label
    pred_name = CLASS_NAMES[pred_cls] if pred_cls >= 0 else 'NOT DETECTED'
    label = f'Pred: {pred_name} | Conf: {conf:.3f} | ({pred_x:.0f}, {pred_y:.0f})' if pred_x else 'NOT DETECTED'

    try:
        font = ImageFont.truetype("arial.ttf", max(20, int(min(W, H) * 0.012)))
    except:
        font = ImageFont.load_default()

    bbox = draw.textbbox((10, 10), label, font=font)
    draw.rectangle([bbox[0]-5, bbox[1]-5, bbox[2]+5, bbox[3]+5], fill='black')
    color = 'lime' if conf >= 0.01 else 'red'
    draw.text((10, 10), label, fill=color, font=font)

    # Build output filename: folder structure flattened
    rel = img_path.relative_to(TEST_ROOT)
    flat_name = str(rel).replace('\\', '__').replace('/', '__')
    stem = Path(flat_name).stem
    out_name = f'{status}_{conf:.3f}_{stem}.jpg'
    img.save(OUTPUT_DIR / out_name, quality=85)
    img.close()

    if (i + 1) % 50 == 0:
        print(f'  Saved {i+1}/{len(test_images)} (detected so far: {detected_count})...')

# Save predictions to JSON
json_path = Path(r'C:\Users\Jatin\Desktop\skylark\backend\predictions.json')
with open(json_path, 'w') as f:
    json.dump(predictions_dict, f, indent=4)

print(f'\nDone! {len(test_images)} images saved to: {OUTPUT_DIR}')
print(f'Predictions saved to: {json_path}')
print(f'Detected: {detected_count}/{len(test_images)} ({detected_count/len(test_images)*100:.1f}%)')
print(f'Not detected: {len(test_images) - detected_count}')
