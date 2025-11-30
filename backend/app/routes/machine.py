from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import os
from ultralytics import YOLO
from PIL import Image
import io

machine_bp = Blueprint('machine', __name__)

# Load Model
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, 'machine_model', 'best.pt')

try:
    print(f"🔄 Loading YOLO model from: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    print(f"✅ YOLO model loaded successfully!")
    print(f"📋 Model task: {model.task}")
    print(f"📋 Model classes: {model.names}")
except Exception as e:
    print(f"❌ Error loading YOLO model: {e}")
    model = None

@machine_bp.route('/machine/analyze', methods=['POST'])
@jwt_required()
def analyze_frame():
    if not model:
        return jsonify({
            'success': False,
            'message': 'Model AI belum dimuat. Periksa log server.'
        }), 500

    if 'image' not in request.files:
        return jsonify({
            'success': False,
            'message': 'No image uploaded'
        }), 400

    try:
        file = request.files['image']
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes))

        # Convert to RGB
        if img.mode != 'RGB':
            img = img.convert('RGB')

        print(f"🖼️ Image size: {img.size}, mode: {img.mode}")

        # Run detection
        results = model(img, verbose=False)
        result = results[0]

        # Check if any objects detected
        if result.boxes is None or len(result.boxes) == 0:
            print("⚠️ No objects detected in image")
            return jsonify({
                'success': True,
                'data': {
                    'status': 'healthy',  # No defects found
                    'accuracy': 0,
                    'detections': []
                }
            })

        # Process all detections
        detections = []
        max_confidence = 0
        dominant_status = 'healthy'

        for box in result.boxes:
            conf = float(box.conf[0])
            cls_idx = int(box.cls[0])
            label = model.names[cls_idx]
            
            # Get bounding box
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            detections.append({
                'label': label,
                'confidence': round(conf * 100, 1),
                'bbox': [x1, y1, x2, y2]
            })

            # ✅ FIXED: Map Indonesian labels to status
            label_lower = label.lower()
            
            # Check for defect (Rusak, Cacat, etc.)
            is_defect = any(keyword in label_lower for keyword in 
                          ['rusak', 'cacat', 'buruk', 'jelek'])
            
            # Check for healthy (Bagus, Baik, Sehat, etc.)
            is_healthy = any(keyword in label_lower for keyword in 
                           ['bagus', 'baik', 'sehat', 'good'])
            
            # Determine current status
            if is_defect:
                current_status = 'defect'
            elif is_healthy:
                current_status = 'healthy'
            else:
                print(f"⚠️ Unknown label: '{label}'")
                current_status = 'healthy'  # Default to healthy for unknown

            # Update dominant if higher confidence
            if conf > max_confidence:
                max_confidence = conf
                dominant_status = current_status

            print(f"🔍 Detection: '{label}' → {current_status} (conf: {conf:.3f})")

        print(f"🎯 Final status: {dominant_status} with confidence {max_confidence:.3f}")

        return jsonify({
            'success': True,
            'data': {
                'status': dominant_status,
                'accuracy': round(max_confidence * 100, 1),
                'detections': detections,
                'total_objects': len(detections)
            }
        })

    except Exception as e:
        print(f"❌ Inference Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
