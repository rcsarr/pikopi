from flask import Blueprint, jsonify
from psycopg2 import sql
import random
from datetime import datetime
from app import get_db_connection

api_bp = Blueprint('api', __name__, url_prefix='/api')

# ========== UPDATE FUNCTION (untuk scheduler) ==========
def update_sorting_results_ord001():
    """Update ORD-001 dengan data random setiap 5 detik"""
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return
    
    try:
        cur = conn.cursor()
        
        # Generate data random (simulasi hasil scanning)
        total_beans = random.randint(60, 70)
        healthy_beans = random.randint(45, 60)
        defective_beans = total_beans - healthy_beans
        
        healthy_percentage = round((healthy_beans / total_beans) * 100, 2)
        defective_percentage = round((defective_beans / total_beans) * 100, 2)
        
        total_weight = round(total_beans * random.uniform(0.9, 1.1), 2)
        healthy_weight = round(total_weight * (healthy_percentage / 100), 2)
        defective_weight = total_weight - healthy_weight
        
        accuracy = round(random.uniform(85, 98), 2)
        
        # Update sorting_results (trigger history otomatis)
        update_query = sql.SQL("""
            UPDATE sorting_results
            SET 
                total_beans = %s,
                healthy_beans = %s,
                defective_beans = %s,
                healthy_percentage = %s,
                defective_percentage = %s,
                total_weight = %s,
                healthy_weight = %s,
                defective_weight = %s,
                accuracy = %s,
                sorted_at = NOW()
            WHERE order_id = %s
        """)
        
        cur.execute(update_query, (
            total_beans,
            healthy_beans,
            defective_beans,
            healthy_percentage,
            defective_percentage,
            total_weight,
            healthy_weight,
            defective_weight,
            accuracy,
            'ORD-001'
        ))
        
        conn.commit()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] ✓ Updated ORD-001 | Beans: {total_beans} | Healthy: {healthy_beans} | Accuracy: {accuracy}%")
        
        cur.close()
        
    except Exception as e:
        print(f"Error updating data: {e}")
        conn.rollback()
    finally:
        conn.close()

# ========== API ROUTES ==========

@api_bp.route('/sorting/<order_id>', methods=['GET'])
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

@api_bp.route('/sorting/<order_id>/history', methods=['GET'])
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
        
        # Convert datetime to string
        for item in data:
            for key in ['sorted_at', 'created_at', 'recorded_at']:
                if item[key]:
                    item[key] = item[key].isoformat()
        
        cur.close()
        conn.close()
        return jsonify(data), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/status', methods=['GET'])
def status():
    """GET status scheduler"""
    return jsonify({
        'status': 'running',
        'message': 'Scheduler updating ORD-001 every 5 seconds',
        'updating': True
    }), 200
