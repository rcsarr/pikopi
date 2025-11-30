from flask import Blueprint, jsonify
from app import db
from sqlalchemy import text

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    try:
        db.session.execute(text('SELECT 1'))
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'API is running and database connection is healthy',
            'status': 'healthy',
            'database': 'connected'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Database connection error: {str(e)}',
            'status': 'unhealthy',
            'database': 'disconnected'
        }), 500

@health_bp.route('/', methods=['GET'])
def root():
    return jsonify({
        'success': True,
        'message': 'PilahKopi Backend API',
        'version': '1.0.0',
        'status': 'running'
    }), 200 