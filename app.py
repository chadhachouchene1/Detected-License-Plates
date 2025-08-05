from flask import Flask, jsonify, send_from_directory,request
from flask_cors import CORS
import pandas as pd
import os
import csv

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return 'Flask backend is running!'


#delete alll 
@app.route('/api/delete-multiple', methods=['POST'])
def delete_multiple():
    csv_file = 'plates.csv'
    try:
        ids = request.json.get('ids', [])
        if not isinstance(ids, list):
            return jsonify({'error': 'Invalid input'}), 400

        updated_rows = []
        deleted_ids = set()
        with open(csv_file, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            if fieldnames is None:
                return jsonify({'error': 'CSV header missing'}), 500

            for row in reader:
                if int(row['id']) not in ids:
                    updated_rows.append(row)
                else:
                    deleted_ids.add(int(row['id']))

        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(updated_rows)

        return jsonify({'message': f'Deleted plates: {list(deleted_ids)}'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

#update the plate !! 


@app.route('/api/plates/<int:plate_id>', methods=['PUT'])
def update_plate(plate_id):
    csv_file = 'plates.csv'
    new_plate = request.json.get('plate')

    if not new_plate:
        return jsonify({'error': 'No plate value provided'}), 400

    try:
        updated = False
        rows = []

        with open(csv_file, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            if not fieldnames:
                return jsonify({'error': 'CSV header missing'}), 500

            for row in reader:
                if int(row['id']) == plate_id:
                    row['plate'] = new_plate
                    updated = True
                rows.append(row)

        if not updated:
            return jsonify({'error': 'Plate ID not found'}), 404

        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

        return jsonify({'message': f'Plate ID {plate_id} updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500



# Skip this row to delete it !!delete
@app.route('/api/plates/<int:plate_id>', methods=['DELETE'])
def delete_plate(plate_id):
    csv_file = 'plates.csv'
    try:
        rows = []
        found = False

        with open(csv_file, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            if fieldnames is None:
                return jsonify({'error': 'CSV header missing'}), 500

            for row in reader:
                if int(row['id']) == plate_id:
                    found = True
                    continue
                rows.append(row)

        if not found:
            return jsonify({'error': 'Plate ID not found'}), 404

        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

        return jsonify({'message': f'Plate ID {plate_id} deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/plates', methods=['GET'])
def get_plates():
    data = []
    try:
        with open('plates.csv', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader, None)  # Skip header if present
            for row in reader:
                if len(row) != 6:
                    continue  # skip malformed rows
                id_, date, time, plate, plate_image, original_image = row
                data.append({
                    'id': int(id_),
                    'date': date,
                    'time': time,
                    'plate': plate,
                    'plate_image': plate_image,
                    'original_image': original_image
                })
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/plates/<filename>')
def get_plate_image(filename):
    return send_from_directory('plates', filename)

@app.route('/original_images/<filename>')
def get_original_image(filename):
    return send_from_directory('original_images', filename)

if __name__ == '__main__':
    if not os.path.exists('plates.csv'):
        open('plates.csv', 'w').close()
    os.makedirs('plates', exist_ok=True)
    os.makedirs('original_images', exist_ok=True)
    app.run(debug=True, port=5000)
