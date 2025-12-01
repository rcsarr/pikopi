from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from supabase import create_client, Client
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql
import os
from datetime import datetime

# Load environment variables
load_dotenv()

# ========== SUPABASE CONFIG ==========
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# ========== DATABASE CONFIG ==========
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'pilahkopi_db'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'czartekom'),
    'port': int(os.getenv('DB_PORT', 5432))
}

# ========== FILE CONFIG ==========
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def get_db_connection():
    """Buat koneksi ke database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ========== CREATE APP FACTORY ==========
def create_app():
    """Factory function untuk create Flask app"""
    app = Flask(__name__)
    
    # Config
    app.config['JSON_SORT_KEYS'] = False
    app.config['CORS_HEADERS'] = 'Content-Type'
    
    # Enable CORS untuk React
    CORS(app)
    
    # ========== PAYMENT UPLOAD ROUTES ==========
    
    @app.route('/api/payments/upload', methods=['POST'])
    def upload_payment_proof():
        """Upload foto bukti pembayaran ke Supabase Storage"""
        try:
            if 'file' not in request.files:
                return jsonify({'error': 'No file part'}), 400
            
            file = request.files['file']
            payment_id = request.form.get('payment_id')
            
            if not payment_id:
                return jsonify({'error': 'payment_id required'}), 400
            
            if file.filename == '':
                return jsonify({'error': 'No selected file'}), 400
            
            if not allowed_file(file.filename):
                return jsonify({'error': 'File type not allowed'}), 400
            
            file_data = file.read()
            file.seek(0)
            
            if len(file_data) > MAX_FILE_SIZE:
                return jsonify({'error': 'File too large (max 5MB)'}), 400
            
            # Generate filename unik
            ext = file.filename.rsplit('.', 1)[1].lower()
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{payment_id}_{timestamp}.{ext}"
            
            # Upload ke Supabase Storage
            try:
                response = supabase.storage.from_('payments').upload(
                    path=filename,
                    file=file_data,
                    file_options={"content-type": f"image/{ext}"}
                )
                
                # Dapatkan public URL
                public_url = supabase.storage.from_('payments').get_public_url(filename)
                
                # Simpan URL ke database
                conn = get_db_connection()
                if conn:
                    cur = conn.cursor()
                    update_query = sql.SQL("""
                        UPDATE payments
                        SET proof_image = %s,
                            updated_at = NOW()
                        WHERE id = %s
                    """)
                    cur.execute(update_query, (public_url, payment_id))
                    conn.commit()
                    cur.close()
                    conn.close()
                
                return jsonify({
                    'success': True,
                    'photo_url': public_url,
                    'filename': filename,
                    'message': 'File uploaded successfully'
                }), 200
                
            except Exception as e:
                return jsonify({'error': f'Upload to Supabase failed: {str(e)}'}), 500
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/payments/<payment_id>', methods=['GET'])
    def get_payment(payment_id):
        """GET payment details dengan foto URL"""
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cur = conn.cursor()
            query = sql.SQL("""
                SELECT id, order_id, user_id, method, account_name, amount, 
                       proof_image, created_at, updated_at
                FROM payments
                WHERE id = %s
            """)
            cur.execute(query, (payment_id,))
            result = cur.fetchone()
            
            if result:
                columns = [desc[0] for desc in cur.description]
                data = dict(zip(columns, result))
                for key in ['created_at', 'updated_at']:
                    if data[key]:
                        data[key] = data[key].isoformat()
                cur.close()
                conn.close()
                return jsonify(data), 200
            else:
                cur.close()
                conn.close()
                return jsonify({'error': 'Payment not found'}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # ========== SORTING RESULTS ROUTES ==========

    @app.route('/api/sorting/<order_id>', methods=['GET'])
    def get_sorting_result(order_id):
        """GET current data untuk sebuah order"""
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cur = conn.cursor()
            query = sql.SQL("""
                SELECT id, order_id, user_id, total_beans, healthy_beans, defective_beans,
                       healthy_percentage, defective_percentage, total_weight, healthy_weight,
                       defective_weight, accuracy, sorted_at, created_at
                FROM sorting_results
                WHERE order_id = %s
            """)
            
            cur.execute(query, (order_id,))
            result = cur.fetchone()
            
            if result:
                columns = [desc[0] for desc in cur.description]
                data = dict(zip(columns, result))
                for key in ['sorted_at', 'created_at']:
                    if data[key]:
                        data[key] = data[key].isoformat()
                cur.close()
                conn.close()
                return jsonify(data), 200
            else:
                cur.close()
                conn.close()
                return jsonify({'error': 'Order not found'}), 404
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/sorting/<order_id>/history', methods=['GET'])
    def get_sorting_history(order_id):
        """GET history data untuk sebuah order"""
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cur = conn.cursor()
            query = sql.SQL("""
                SELECT history_id, id, order_id, user_id, total_beans, healthy_beans, 
                       defective_beans, healthy_percentage, defective_percentage, 
                       total_weight, healthy_weight, defective_weight, accuracy, 
                       sorted_at, created_at, recorded_at, action
                FROM sorting_results_history
                WHERE order_id = %s
                ORDER BY recorded_at DESC
                LIMIT 50
            """)
            
            cur.execute(query, (order_id,))
            results = cur.fetchall()
            
            columns = [desc[0] for desc in cur.description]
            data = [dict(zip(columns, row)) for row in results]
            
            for item in data:
                for key in ['sorted_at', 'created_at', 'recorded_at']:
                    if item[key]:
                        item[key] = item[key].isoformat()
            
            cur.close()
            conn.close()
            return jsonify(data), 200
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/status', methods=['GET'])
    def status():
        """GET status scheduler"""
        return jsonify({
            'status': 'running',
            'message': 'Scheduler updating ORD-001 every 5 seconds',
            'updating': True
        }), 200

    @app.route('/health', methods=['GET'])
    def health():
        """Health check endpoint"""
        return jsonify({'status': 'OK', 'message': 'Server is running'}), 200

    return app