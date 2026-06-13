import requests

url = "https://jatinnath-skylark-gcp.hf.space/predict"
img_path = r"c:\Users\Jatin\Desktop\skylark\public\sampleimages\DJI_0109.JPG"

print(f"Sending test image to {url}...")
try:
    with open(img_path, 'rb') as f:
        res = requests.post(url, files={'file': f})
    
    print(f"HTTP Status: {res.status_code}")
    if res.status_code == 200:
        d = res.json()
        print(f"Prediction Status: {d.get('status')}")
        print(f"Detected Class: {d.get('class')}")
        print(f"Confidence: {d.get('confidence')}")
        print(f"X, Y: {d.get('x')}, {d.get('y')}")
        print(f"Image Base64 length: {len(d.get('image_b64', ''))}")
    else:
        print(res.text)
except Exception as e:
    print(f"Error: {e}")
