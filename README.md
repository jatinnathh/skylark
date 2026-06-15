# Aerial GCP Pose Estimation

## Project Overview

This repository contains the complete, end-to-end solution for the Aerial Ground Control Point (GCP) Pose Estimation project. The goal of this system is to accurately detect and estimate the precise spatial coordinates (pose) of Ground Control Points in high-resolution aerial imagery. 

The project includes an entire machine learning pipeline (from data preprocessing to model training), a specialized high-resolution inference script, and a full-stack web application (Next.js + FastAPI) to interact with the trained model via a Hugging Face Space integration.

## Key Features

*   **State-of-the-Art Pose Estimation:** Utilizes the YOLOv11s Pose architecture to predict exact sub-pixel center points of GCP markers, rather than just standard bounding boxes.
*   **Custom Data Oversampling:** Implements a programmatic "Zoomed-in" data augmentation strategy that expands the training dataset from 1,001 to 2,600 images, dramatically increasing model robustness against altitude variations.
*   **High-Resolution Sliding Window Inference:** Replaces standard global image resizing with a CNN-like sliding window strategy. This preserves crucial spatial details in massive 4K+ aerial images, leading to highly confident detections.
*   **Full-Stack Web Interface:** A Next.js frontend paired with a FastAPI proxy backend allows users to upload images and visualize predictions in real-time.
*   **Hugging Face Space Integration:** The FastAPI backend is configured to seamlessly route prediction requests to a hosted Hugging Face Space model endpoint.

## Technology Stack

*   **Machine Learning:** Python, Ultralytics (YOLO), OpenCV, Pillow, Jupyter Notebook
*   **Backend API:** Python, FastAPI, Uvicorn, HTTPX
*   **Frontend Web App:** Next.js (React), TypeScript, Tailwind CSS
*   **Deployment Target:** Vercel (Frontend), Hugging Face Spaces (Model Inference)

## Repository Structure

```text
skylark/
├── train_yolo.ipynb              # Complete EDA, preprocessing, and model training pipeline
├── Decision_Log.md               # Detailed write-up on architecture rationale & strategies
├── backend/
│   ├── save_test_predictions.py  # Core script for generating the predictions.json file
│   └── predictions.json          # The final generated output format (post-inference)
├── api/
│   └── index.py                  # FastAPI proxy server connecting to Hugging Face
├── app/                          # Next.js frontend application source code
├── data/                         # Directory for raw and processed datasets (ignored in git)
├── requirements.txt              # Python dependencies
└── package.json                  # Node.js dependencies
```

## Getting Started: Installation

### 1. Prerequisites
*   Node.js (v18+)
*   Python (3.8+)
*   Git

### 2. Clone the Repository
```bash
git clone [YOUR_REPO_LINK]
cd skylark
```

### 3. Backend Setup (Python)
It is recommended to use a virtual environment.
```bash
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
```

### 4. Frontend Setup (Node.js)
```bash
npm install
```

## Running the Web Application Locally

The full-stack application requires both the FastAPI backend and the Next.js frontend to run concurrently.

### 1. Configure Environment Variables
If you are testing the live web app, ensure you have a Hugging Face Space running the model. Create a `.env` file in the root directory (or export it in your terminal) to link the API:
```env
```

### 2. Start the Backend API
```bash
cd backend
uvicorn api:app --host 127.0.0.1 --port 8000
```
*The backend will start and expose a health check at `http://127.0.0.1:8000/api/health`.*

### 3. Start the Next.js Frontend
Open a new terminal window at the root of the project:
```bash
npm run dev
```
*The web interface is now accessible at `http://localhost:3000`.*

## Generating Test Predictions (For Submission)

To reproduce the exact `predictions.json` file for the unlabelled test dataset using the sliding window algorithm:

1.  **Download Model Weights:** Download the `best.pt` model weights (link provided in the `Decision_Log.md`) and place them in `backend/runs/gcp_pose/weights/best.pt`.
2.  **Prepare Test Data:** Ensure the unlabelled test images are located at `data/GCP_Assignment_Datasets/test_dataset/`.
3.  **Run the Inference Script:**
    From the root directory, execute:
    ```bash
    python backend/save_test_predictions.py
    ```
4.  **Output:** 
    *   Visualizations with bounding boxes and keypoint markers will be saved in `backend/testimage/`.
    *   The final submission file will be generated at `backend/predictions.json`.

## Technical Documentation & Decisions

For a deep dive into why YOLOv11s Pose was chosen, how the zoomed-in oversampling mitigates scale variation challenges, and the exact mechanics of the sliding window inference, please refer to the [Decision_Log.md](./Decision_Log.md). This document serves as the formal technical write-up for this project.

![Visitor Count](https://komarev.com/ghpvc/?username=jatinnathh&color=blue)
