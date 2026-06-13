# Decision Log and Technical Write-up

## 1. Network Architecture Choice and Rationale

**Primary Architecture:** YOLOv11s Pose

**Rationale:**
The decision to utilize the YOLOv11s Pose architecture was driven by the need for a highly efficient, state-of-the-art model capable of precise keypoint detection. Aerial Ground Control Point (GCP) pose estimation requires not just bounding box localization, but exact sub-pixel coordinate predictions for the GCP markers. YOLOv11s (Small) strikes an optimal balance between computational efficiency and high precision. Its lightweight nature allows for faster inference times while its advanced feature extraction backbones are highly adept at identifying spatial features necessary for accurate pose estimation in complex aerial imagery.

## 2. Training Strategy and Data Handling

**Data Augmentation and Oversampling Strategy:**
A critical component of our training strategy involved addressing the limited initial dataset size and ensuring the model learned the fine-grained details of the GCPs. 

* **Zoomed-in Oversampling (Highlighted Strategy):** The original training dataset consisted of 1,001 images, which posed a risk of overfitting and poor generalization given the complexity of aerial data. To mitigate this, an aggressive oversampling strategy was implemented. By programmatically generating zoomed-in crops centered around the GCPs within the existing training data, the dataset was expanded from 1,001 to 2,600 training images. This forced the model to learn the high-resolution, intricate textures and patterns of the GCP markers at varying scales, significantly improving its robustness against varying flight altitudes and camera resolutions.

**Loss Functions and Optimization:**
The model was trained utilizing a combination of bounding box regression loss and keypoint estimation loss. This dual-loss approach ensures that the model not only finds the region containing the GCP but accurately maps the precise spatial coordinates of the center point.

## 3. Inference Strategy and Accuracy Enhancements

**Sliding Window Classification Strategy (Highlighted Strategy):**
To maximize prediction accuracy during inference on large, high-resolution test images, a CNN-like sliding window classification strategy was deployed. Instead of resizing the entire large aerial image to the model's native input resolution (which would result in a massive loss of spatial detail and invisible GCPs), the inference script processes the image in overlapping patches or windows. 

This sliding window approach ensures that the YOLOv11s Pose model examines every region of the image at a resolution that preserves the structural integrity of the GCPs. Predictions from overlapping windows are aggregated, and filtering techniques are applied to remove duplicate detections, resulting in a highly accurate, confident final prediction for the GCP coordinates.

## 4. Challenges Encountered and Mitigations

* **Challenge:** Drastic scale variations of GCPs depending on drone altitude.
  * **Mitigation:** The zoomed-in oversampling strategy mentioned above provided the model with a robust understanding of the markers at various apparent sizes.
* **Challenge:** Loss of detail during standard image resizing for inference.
  * **Mitigation:** Implemented the sliding window strategy, ensuring inference is always run on high-resolution crops rather than a globally downsampled image.
* **Challenge:** Class imbalance and background false positives.
  * **Mitigation:** The expanded dataset of 2,600 images allowed the network to better learn the distinct geometric features of true GCPs versus background noise.

## 5. Reproduction and Inference Instructions

### Model Weights
The best performing model weights are hosted externally.
* **Download Link:** "https://drive.google.com/file/d/129KtZ77mEg72mxGaCyx6zkim3kCDS2d0/view?usp=drive_link"
* **Instructions:** Download the weights file and place it in the appropriate directory before running the inference script.

### Codebase Structure
The repository contains all necessary scripts for data loading, model training, and inference.
* `backend/save_test_predictions.py`: The primary inference script used to generate the final predictions.

### Generating predictions.json
To reproduce the final `predictions.json` file on the unlabelled test dataset, follow these steps:

1. Ensure all dependencies are installed.
2. Place the unlabelled test dataset in the designated directory.
3. Ensure the downloaded model weights are in the correct path.
4. Execute the inference script. For example:

```bash
python backend/save_test_predictions.py
```

The script will process the images using the sliding window strategy and output a `predictions.json` file formatted exactly like the training labels.
