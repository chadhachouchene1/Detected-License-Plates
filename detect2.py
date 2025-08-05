import torch
import easyocr
import cv2
import csv
from datetime import datetime
import os
import sys
import pathlib

# Compatibility for Windows
if sys.platform == "win32":
    pathlib.PosixPath = pathlib.WindowsPath

# === Load YOLOv5 model ===
model = torch.hub.load('yolov5', 'custom', path='best.pt', source='local', force_reload=True)

# === Load image ===
image_path = '2.jpg'
img = cv2.imread(image_path)

# === Save original image ===
original_images_folder = 'original_images'
os.makedirs(original_images_folder, exist_ok=True)
original_timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
original_filename = f'original_{original_timestamp}.jpg'
original_image_path = os.path.join(original_images_folder, original_filename)
cv2.imwrite(original_image_path, img)

# === Run detection ===
results = model(image_path)
detections = results.xyxy[0]  # [x1, y1, x2, y2, conf, class]

# === Init EasyOCR ===
ocr_reader = easyocr.Reader(['en'])

# === Create folders ===
plates_folder = 'plates'
os.makedirs(plates_folder, exist_ok=True)

# === CSV Handling ===
csv_file = 'plates.csv'
fieldnames = ['id', 'date', 'time', 'plate', 'plate_image', 'original_image']

# Get last ID
last_id = -1
if os.path.exists(csv_file):
    with open(csv_file, newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader, None)  # Skip header
        for row in reader:
            try:
                row_id = int(row[0])
                if row_id > last_id:
                    last_id = row_id
            except (IndexError, ValueError):
                continue
# === Process detections ===
plate_counter = 0
for det in detections:
    x1, y1, x2, y2, conf, cls = map(int, det[:6])
    cropped = img[y1:y2, x1:x2]

    # Save cropped plate
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    plate_counter += 1
    plate_filename = f'plate_{timestamp}_{plate_counter}.jpg'
    crop_path = os.path.join(plates_folder, plate_filename)
    cv2.imwrite(crop_path, cropped)

    # OCR
    result = ocr_reader.readtext(cropped)
    if result:
        all_text = [d[1].strip() for d in result if d[1].strip()]
        text = ' '.join(all_text) if all_text else 'N/A'
    else:
        text = 'N/A'

    # Time info
    csv_timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    date, time = csv_timestamp.split(' ')

    # Increment ID
    new_id = last_id + 1
    last_id = new_id

    # Append to CSV
    with open(csv_file, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writerow({
            'id': new_id,
            'date': date,
            'time': time,
            'plate': text,
            'plate_image': plate_filename,
            'original_image': original_filename
        })

    # Draw box and label
    label = f'{text}'
    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
    cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12), 2)

# === Save result image ===
results_folder = 'results'
os.makedirs(results_folder, exist_ok=True)
result_timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
result_filename = f'result_{result_timestamp}.jpg'
result_path = os.path.join(results_folder, result_filename)
cv2.imwrite(result_path, img)

# === Final print statements ===
print(f"✅ Detection complete!")
print(f"🖼 Original image saved: {original_filename}")
print(f"📸 Result image with detections saved: {result_filename}")
print(f"🔍 Found {len(detections)} plate(s)")
print(f"📄 Check plates.csv for detection details")
