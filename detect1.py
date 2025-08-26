import torch
import easyocr
import cv2
import csv
from datetime import datetime
import os
import sys
import pathlib
import numpy as np
from difflib import SequenceMatcher

# Windows compatibility
if sys.platform == "win32":
    pathlib.PosixPath = pathlib.WindowsPath

# === YOLOv5 model ===
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = torch.hub.load('yolov5', 'custom', path='best.pt', source='local').to(device)
model.conf = 0.4
model.iou = 0.45

# === OCR reader ===
ocr_reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())

# === Folders ===
original_images_folder = 'original_images'
plates_folder = 'plates'
os.makedirs(original_images_folder, exist_ok=True)
os.makedirs(plates_folder, exist_ok=True)

# === CSV setup ===
csv_file = 'plates.csv'
fieldnames = ['id', 'date', 'time', 'plate', 'plate_image', 'original_image']
if not os.path.exists(csv_file):
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

# Get last ID
last_id = -1
with open(csv_file, newline='', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader, None)
    for row in reader:
        try:
            row_id = int(row[0])
            if row_id > last_id:
                last_id = row_id
        except (IndexError, ValueError):
            continue

# === Camera capture ===
cap = cv2.VideoCapture(0)
plate_counter = 0

# === Plate tracking ===
active_plates = {}  # {normalized_text: last_seen_time}
cooldown_seconds = 5

def normalize_text(text):
    return ''.join(c for c in text if c.isalnum()).upper()

def is_new_plate(normalized_text):
    for plate in list(active_plates.keys()):
        similarity = SequenceMatcher(None, normalized_text, plate).ratio()
        if similarity > 0.8:  # too similar, consider duplicate
            return False
    return True

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_resized = cv2.resize(frame, (1280, 720))
    kernel = np.array([[0, -1, 0], [-1, 5,-1], [0, -1, 0]])
    frame_sharp = cv2.filter2D(frame_resized, -1, kernel)

    # YOLO detection
    results = model(frame_sharp)
    detections = results.xyxy[0]

    for det in detections:
        x1, y1, x2, y2, conf, cls = det
        if conf < 0.4:
            continue

        x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
        cropped = frame_sharp[y1:y2, x1:x2]
        if cropped.size == 0:
            continue

        # OCR preprocessing
        gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        cropped_small = cv2.resize(thresh, (0,0), fx=0.5, fy=0.5)

        ocr_result = ocr_reader.readtext(cropped_small)
        text = ' '.join([d[1].strip() for d in ocr_result if d[1].strip()]) if ocr_result else None
        if not text:
            continue

        normalized_text = normalize_text(text)
        now = datetime.now()

        # Cooldown check + fuzzy duplicate check
        last_seen = active_plates.get(normalized_text)
        if last_seen and (now - last_seen).total_seconds() < cooldown_seconds:
            continue
        if not is_new_plate(normalized_text):
            continue

        # Update tracker
        active_plates[normalized_text] = now

        # Save cropped plate
        timestamp = now.strftime('%Y%m%d_%H%M%S')
        plate_counter += 1
        plate_filename = f'plate_{timestamp}_{plate_counter}.jpg'
        cv2.imwrite(os.path.join(plates_folder, plate_filename), cropped)

        # Save original frame
        original_filename = f'original_{timestamp}.jpg'
        cv2.imwrite(os.path.join(original_images_folder, original_filename), frame_sharp)

        # CSV entry
        date, time = now.strftime('%Y-%m-%d %H:%M:%S').split(' ')
        last_id += 1
        with open(csv_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writerow({
                'id': last_id,
                'date': date,
                'time': time,
                'plate': text,
                'plate_image': plate_filename,
                'original_image': original_filename
            })

        # Draw box
        label = f"{text} ({conf:.2f})"
        cv2.rectangle(frame_sharp, (x1, y1), (x2, y2), (0,255,0), 2)
        cv2.putText(frame_sharp, label, (x1, y1-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (36,255,12), 2)

    cv2.imshow("Plate Detection", frame_sharp)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
