from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.forum import ForumThread, ForumMessage
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
import re
from sqlalchemy.exc import OperationalError, DisconnectionError
import time
import requests
import base64
import os
from werkzeug.utils import secure_filename

# Di bagian atas file, setelah imports
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'profiles')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Pastikan folder uploads ada
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

auth_bp = Blueprint('auth', __name__)

def generate_user_id():
    """Generate unique user ID"""
    try:
        last_user = User.query.order_by(User.id.desc()).first()
        if last_user and last_user.id:
            try:
                last_num = int(last_user.id.split('-')[1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1

        while True:
            new_id = f'USR-{str(next_num).zfill(3)}'
            if not User.query.get(new_id):
                return new_id
            next_num += 1
    except Exception:
        return f'USR-{str(1).zfill(3)}'

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def execute_with_retry(func, max_retries=3):
    """Execute database operation with retry logic"""
    for attempt in range(max_retries):
        try:
            return func()
        except (OperationalError, DisconnectionError) as e:
            if attempt < max_retries - 1:
                error_msg = str(e).lower()
                if "server closed the connection" in error_msg or "connection" in error_msg:
                    # Wait before retry, exponential backoff
                    wait_time = (attempt + 1) * 0.5
                    time.sleep(wait_time)
                    # Invalidate the connection
                    db.session.rollback()
                    continue
            raise
        except Exception:
            raise

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        required_fields = ['email', 'password', 'name']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'message': f'Field {field} is required'
                }), 400
        
        # ⭐ PROTEKSI: Tolak request yang mencoba set role
        if 'role' in data and data['role'] != 'user':
            return jsonify({
                'success': False,
                'message': 'Cannot set role during registration. All users are registered as regular users.'
            }), 403
        
        # Validasi email
        if not validate_email(data['email']):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Validasi password
        if len(data['password']) < 8:
            return jsonify({
                'success': False,
                'message': 'Password must be at least 8 characters'
            }), 400
        
        # Check if email exists with retry
        def check_email():
            return User.query.filter_by(email=data['email']).first()
        
        existing_user = execute_with_retry(check_email)
        
        if existing_user:
            return jsonify({
                'success': False,
                'message': 'Email already registered'
            }), 400
        
        # ✅ Create user dengan role HARDCODED sebagai 'user'
        user = User(
            id=generate_user_id(),
            email=data['email'],
            name=data['name'],
            phone=data.get('phone'),
            company_name=data.get('companyName'),
            address=data.get('address'),
            role='user'  # ✅ PAKSA sebagai 'user'
        )
        
        user.set_password(data['password'])
        
        # Save with retry
        def save_user():
            db.session.add(user)
            db.session.commit()
            return user
        
        saved_user = execute_with_retry(save_user)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'data': {
                'userId': saved_user.id,
                'email': saved_user.email,
                'name': saved_user.name,
                'role': saved_user.role,
                'emailVerificationRequired': False
            }
        }), 201
        
    except (OperationalError, DisconnectionError) as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database connection error. Please try again or contact support if the problem persists.'
        }), 503
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Registration failed: {str(e)}'
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400

        # Find user with retry
        def find_user():
            return User.query.filter_by(email=data['email']).first()
        
        user = execute_with_retry(find_user)

        if not user or not user.check_password(data['password']):
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401

        if not user.is_active:
            return jsonify({
                'success': False,
                'message': 'Account is deactivated'
            }), 403

        if data.get('role') and user.role != data['role']:
            return jsonify({
                'success': False,
                'message': f'Access denied. This account is not a {data["role"]}'
            }), 403

        # Update last login with retry
        def update_login():
            user.last_login = datetime.utcnow()
            db.session.commit()
            return user
        
        execute_with_retry(update_login)

        access_token = create_access_token(identity=user.id)

        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'token': access_token,
                'user': user.to_dict(),
                'expiresIn': 3600
            }
        }), 200

    except (OperationalError, DisconnectionError) as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database connection error. Please try again or contact support if the problem persists.'
        }), 503
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Login failed: {str(e)}'
        }), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        
        # Find user with retry
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)

        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404

        return jsonify({
            'success': True,
            'data': user.to_dict()
        }), 200

    except (OperationalError, DisconnectionError) as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database connection error. Please try again.'
        }), 503
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get user: {str(e)}'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout endpoint (JWT is stateless, so we just return success)
    Client should remove token from storage
    In production, you might want to implement token blacklisting
    """
    try:
        # Get token info (optional, for logging)
        jwt_data = get_jwt()
        
        return jsonify({
            'success': True,
            'message': 'Logout berhasil'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Logout gagal: {str(e)}'
        }), 500

import requests
import base64

@auth_bp.route('/update-profile', methods=['PUT', 'POST'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        if not user:
            return jsonify({"success": False, "message": "User tidak ditemukan"}), 404

        print(f"🔔 Update profile for user: {user_id}")
        print(f"📋 Content-Type: {request.content_type}")
        
        # Handle multipart/form-data (file upload)
        if request.content_type and "multipart/form-data" in request.content_type:
            print("📎 Processing file upload...")
            
            # Update text fields
            if 'name' in request.form:
                user.name = request.form['name'].strip()
            if 'phone' in request.form:
                user.phone = request.form['phone'].strip() if request.form.get('phone') else None
            if 'companyName' in request.form:
                user.company_name = request.form['companyName'].strip() if request.form.get('companyName') else None
            if 'address' in request.form:
                user.address = request.form['address'].strip() if request.form.get('address') else None
            
            # Handle profile image upload
            if 'profileImage' in request.files:
                file = request.files['profileImage']
                
                if file and file.filename and allowed_file(file.filename):
                    try:
                        # ✅ Generate unique filename
                        timestamp = int(time.time())
                        file_ext = file.filename.rsplit('.', 1)[1].lower()
                        filename = f"{user_id}_{timestamp}.{file_ext}"
                        
                        # ✅ Save file locally
                        filepath = os.path.join(UPLOAD_FOLDER, filename)
                        file.save(filepath)
                        
                        # ✅ Generate URL path
                        # Frontend akan access via: http://localhost:5010/uploads/profiles/USR-001_xxx.jpg
                        image_url = f"/uploads/profiles/{filename}"
                        
                        # ✅ Delete old profile image if exists
                        if user.profile_image and user.profile_image.startswith('/uploads/'):
                            old_file = os.path.join(
                                os.path.dirname(os.path.dirname(__file__)),
                                user.profile_image.lstrip('/')
                            )
                            if os.path.exists(old_file):
                                os.remove(old_file)
                                print(f"🗑️ Deleted old image: {old_file}")
                        
                        # ✅ Update database
                        user.profile_image = image_url
                        
                        print(f"✅ Profile image saved: {filepath}")
                        print(f"✅ Image URL: {image_url}")
                    
                    except Exception as upload_error:
                        print(f"❌ Upload error: {str(upload_error)}")
                        return jsonify({
                            "success": False, 
                            "message": f"Gagal upload gambar: {str(upload_error)}"
                        }), 500
                else:
                    return jsonify({
                        "success": False,
                        "message": "File tidak valid atau format tidak didukung"
                    }), 400

        else:
            # Handle JSON data (no file)
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "message": "Request body required"}), 400
            
            if 'name' in data:
                user.name = data['name'].strip()
            if 'phone' in data:
                user.phone = data['phone'].strip() if data.get('phone') else None
            if 'companyName' in data:
                user.company_name = data['companyName'].strip() if data.get('companyName') else None
            if 'address' in data:
                user.address = data['address'].strip() if data.get('address') else None

        # Update timestamp
        user.updated_at = datetime.utcnow()
        
        # ✅ Update Forum Author Names
        # We update this unconditionally to ensure consistency. 
        # SQLAlchemy handles this efficiently even if values haven't changed.
        try:
            ForumThread.query.filter_by(author_id=user.id).update({'author_name': user.name})
            ForumMessage.query.filter_by(author_id=user.id).update({'author_name': user.name})
            print(f"✅ Updated forum author names for user {user.id} to {user.name}")
        except Exception as e:
            print(f"⚠️ Failed to update forum author names: {e}")
            # Don't fail the whole request for this
        
        # Save to database
        def save_user():
            db.session.commit()
            return user
        
        saved_user = execute_with_retry(save_user)
        
        print(f"✅ User saved to database")
        print(f"📊 Profile image: {saved_user.profile_image}")
        
        return jsonify({
            "success": True,
            "message": "Profil berhasil diperbarui",
            "data": saved_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error updating profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False, 
            "message": f"Gagal memperbarui profil: {str(e)}"
        }), 500