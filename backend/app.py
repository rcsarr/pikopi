# app.py - Flask Factory Pattern

from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2 import sql

# ========== DATABASE CONFIG ==========
DB_CONFIG = {
    'host': 'localhost',
    'database': 'pilahkopi_db',  # GANTI INI
    'user': 'postgres',                 # GANTI INI
    'password': 'czartekom',        # GANTI INI
    'port': 5432
}

def get_db_connection():
    """Buat koneksi ke database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

# ========== CREATE APP FACTORY ==========
def create_app():
    """Factory function untuk create Flask app"""
    app = Flask(__name__)
    
    # Config
    app.config['JSON_SORT_KEYS'] = False
    app.config['CORS_HEADERS'] = 'Content-Type'
    
    # Enable CORS untuk React
    CORS(app)
    
    # ========== API ROUTES ==========
    
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
                # Convert timestamp to string
                for key in ['sort