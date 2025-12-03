# app/__init__.py

from flask import Flask, make_response, request, send_from_directory, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from datetime import datetime
import pytz
import os
from flask import send_from_directory
from sqlalchemy import event

load_dotenv()
JAKARTA_TZ = pytz.timezone('Asia/Jakarta')

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def get_jakarta_time():
    return datetime.now(JAKARTA_TZ)

def create_app(config_name='development'):
    app = Flask(__name__)
    print('🔧 Registering blueprints...')
    # Config
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("⚠️  WARNING: DATABASE_URL not found in environment variables")
        print("   Please create .env file from env.example and set DATABASE_URL")
        print("   Using default connection (will likely fail)")
        database_url = 'postgresql://postgres:postgres@localhost:5432/pilahkopi_db'
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'pool_size': 10,
        'max_overflow': 20,
        'connect_args': {
            'connect_timeout': 10,
            'options': '-c timezone=Asia/Jakarta'
        }
    }
    
    # JWT Configuration
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400  # 24 hours
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # CORS configuration
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": [
                "Content-Type", 
                "Authorization", 
                "Cache-Control",
                "Pragma",
                "Expires",
                "X-Requested-With"
            ],
            "supports_credentials": True
        }
    })
    
    # ✅ TAMBAHKAN INI - Handle OPTIONS preflight
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", request.headers.get("Origin", "*"))
            response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,Cache-Control,Pragma,Expires,X-Requested-With")
            response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,PATCH,DELETE,OPTIONS")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response, 200

    # Database connection event listeners
    with app.app_context():
        print("\n" + "=" * 60)
        print("📋 REGISTERED ROUTES:")
        print("=" * 60)
        
        # ✅ Show ALL routes (remove filter)
        for rule in app.url_map.iter_rules():
            # Skip static files
            if 'static' not in str(rule):
                methods = ', '.join(sorted([m for m in rule.methods if m not in ['HEAD', 'OPTIONS']]))
                print(f"  {methods:20s} → {rule}")
        
        print("=" * 60 + "\n")

        
        @event.listens_for(db.engine, "connect")
        def receive_connect(dbapi_conn, connection_record):
            print("✅ Database connection established")
        
        @event.listens_for(db.engine, "checkout")
        def receive_checkout(dbapi_conn, connection_record, connection_proxy):
            try:
                cursor = dbapi_conn.cursor()
                cursor.execute("SELECT 1")
                cursor.close()
            except:
                raise Exception("Database connection failed")
    
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        """Serve uploaded files (profile images, etc.)"""
        try:
            # Security: prevent directory traversal
            if '..' in filename or filename.startswith('/'):
                return jsonify({'error': 'Invalid filename'}), 400
            
            uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
            return send_from_directory(uploads_dir, filename)
        except Exception as e:
            print(f"❌ Error serving file: {str(e)}")
            return jsonify({'error': str(e)}), 404
    # ========================================
    # Register ALL Blueprints
    # ========================================
    
    # Authentication routes
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Order management
    from app.routes.orders import orders_bp
    app.register_blueprint(orders_bp, url_prefix='/api')
    
    # Payment management
    from app.routes.payments import payments_bp
    app.register_blueprint(payments_bp, url_prefix='/api')
    
    # Sorting/coffee grading
    from app.routes.sorting import sorting_bp
    app.register_blueprint(sorting_bp, url_prefix='/api')
    
    # Forum/discussion
    from app.routes.forum import forum_bp
    app.register_blueprint(forum_bp, url_prefix='/api/forum')
    
    # Admin management
    from app.routes.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # News/articles
    from app.routes.news import news_bp
    app.register_blueprint(news_bp, url_prefix='/api/news')
    
    # Notifications - ✅ PERBAIKI URL PREFIX
    from app.routes.notification_routes import notification_bp
    app.register_blueprint(notification_bp, url_prefix='/api')  # Bukan '/api/notifications'
    
    # Statistics/analytics
    from app.routes.statistics import statistics_bp
    app.register_blueprint(statistics_bp, url_prefix='/api/statistics')

    # Batch History
    from app.routes.batch_routes import batch_bp
    app.register_blueprint(batch_bp, url_prefix='/api')
    
    # Health check
    from app.routes.health import health_bp
    app.register_blueprint(health_bp, url_prefix='/api')

    # Machine / AI Analysis
    from app.routes.machine import machine_bp
    app.register_blueprint(machine_bp, url_prefix='/api')

    # Machine Management Routes
    from app.routes.machine_routes import machine_routes_bp
    app.register_blueprint(machine_routes_bp, url_prefix='/api')
    
    # ========================================
    # Serve uploaded files
    # ========================================
    @app.route('/api/debug/routes', methods=['GET'])
    def list_all_routes():
        """Debug endpoint to see all registered routes"""
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                'endpoint': rule.endpoint,
                'methods': sorted(list(rule.methods - {'HEAD', 'OPTIONS'})),
                'path': str(rule)
            })
        return jsonify(sorted(routes, key=lambda x: x['path']))
        # Root health check endpoint

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'message': 'API is running'}, 200
    
    # List all routes (helpful for debugging)
    @app.route('/api/routes', methods=['GET'])
    def list_routes():
        routes = []
        for rule in app.url_map.iter_rules():
            if rule.endpoint != 'static':
                routes.append({
                    'endpoint': rule.endpoint,
                    'methods': list(rule.methods),
                    'path': str(rule)
                })
        return {'routes': sorted(routes, key=lambda x: x['path'])}, 200
    
    # Startup information
    print("\n" + "="*50)
    print("🚀 Flask Application Started")
    print("="*50)
    print(f"📊 Database: {database_url.split('@')[1] if '@' in database_url else 'Not configured'}")
    print(f"🔐 JWT Expiry: {app.config['JWT_ACCESS_TOKEN_EXPIRES']}s")
    print(f"🌐 CORS Origins: http://localhost:3000, http://localhost:5173")
    print(f"🔌 Server Port: {os.environ.get('PORT', '5010')}")
    print("="*50)
    print("📡 API endpoints available at: http://localhost:5010/api")
    print("📋 List all routes: http://localhost:5010/api/routes")
    print("❤️  Health check: http://localhost:5010/api/health")
    print("="*50 + "\n")
    
    return app
