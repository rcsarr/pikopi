from flask import Blueprint, request, jsonify, make_response
from app import db
from app.models.notification import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid

notification_bp = Blueprint('notifications', __name__)

# ✅ OPTIONS handler untuk preflight - TAMBAHKAN INI
@notification_bp.route('/notifications', methods=['OPTIONS'])
@notification_bp.route('/notifications/<path:path>', methods=['OPTIONS'])
def handle_options(path=None):
    """Handle CORS preflight requests"""
    response = make_response()
    origin = request.headers.get('Origin')
    if origin in ['http://localhost:3000', 'http://localhost:5173']:
        response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response, 200


@notification_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        print("🔔 Get notifications endpoint called")  # Debug
        user_id = get_jwt_identity()
        print(f"👤 User ID: {user_id}")  # Debug
        
        # Get query parameters
        unread_only = request.args.get('unread', 'false').lower() == 'true'
        limit = int(request.args.get('limit', 50))
        
        print(f"📋 Unread only: {unread_only}, Limit: {limit}")  # Debug
        
        # Build query
        query = Notification.query.filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
        
        print(f"📊 Found {len(notifications)} notifications")  # Debug
        
        return jsonify({
            'success': True,
            'data': [notif.to_dict() for notif in notifications]
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_notifications: {str(e)}")  # Debug
        return jsonify({'success': False, 'message': str(e)}), 500


@notification_bp.route('/notifications/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    try:
        print("🔔 Unread count endpoint called")  # Debug
        user_id = get_jwt_identity()
        print(f"👤 User ID: {user_id}")  # Debug
        
        count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
        print(f"📊 Unread count: {count}")  # Debug
        
        return jsonify({
            'success': True,
            'count': count
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_unread_count: {str(e)}")  # Debug
        return jsonify({'success': False, 'message': str(e)}), 500


@notification_bp.route('/notifications/<notification_id>/read', methods=['PATCH'])
@jwt_required()
def mark_as_read(notification_id):
    try:
        print(f"🔔 Mark as read: {notification_id}")  # Debug
        user_id = get_jwt_identity()
        notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
        
        if not notification:
            print(f"❌ Notification not found: {notification_id}")  # Debug
            return jsonify({'success': False, 'message': 'Notification not found'}), 404
        
        notification.is_read = True
        db.session.commit()
        
        print(f"✅ Notification marked as read: {notification_id}")  # Debug
        
        return jsonify({
            'success': True,
            'message': 'Notification marked as read'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in mark_as_read: {str(e)}")  # Debug
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@notification_bp.route('/notifications/mark-all-read', methods=['PATCH'])
@jwt_required()
def mark_all_read():
    try:
        print("🔔 Mark all as read")  # Debug
        user_id = get_jwt_identity()
        
        updated = Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
        db.session.commit()
        
        print(f"✅ Marked {updated} notifications as read")  # Debug
        
        return jsonify({
            'success': True,
            'message': 'All notifications marked as read',
            'count': updated
        }), 200
        
    except Exception as e:
        print(f"❌ Error in mark_all_read: {str(e)}")  # Debug
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@notification_bp.route('/notifications', methods=['POST'])
@jwt_required()
def create_notification():
    """Create a new notification (for testing or admin use)"""
    try:
        print("🔔 Create notification")  # Debug
        data = request.get_json()
        
        notification = Notification(
            id=f"NOTIF-{uuid.uuid4().hex[:12].upper()}",
            user_id=data['userId'],
            title=data['title'],
            message=data['message'],
            type=data.get('type', 'info'),
            link=data.get('link')
        )
        
        db.session.add(notification)
        db.session.commit()
        
        print(f"✅ Notification created: {notification.id}")  # Debug
        
        return jsonify({
            'success': True,
            'message': 'Notification created',
            'data': notification.to_dict()
        }), 201
        
    except Exception as e:
        print(f"❌ Error in create_notification: {str(e)}")  # Debug
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@notification_bp.route('/notifications/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        print(f"🔔 Delete notification: {notification_id}")  # Debug
        user_id = get_jwt_identity()
        notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
        
        if not notification:
            print(f"❌ Notification not found: {notification_id}")  # Debug
            return jsonify({'success': False, 'message': 'Notification not found'}), 404
        
        db.session.delete(notification)
        db.session.commit()
        
        print(f"✅ Notification deleted: {notification_id}")  # Debug
        
        return jsonify({
            'success': True,
            'message': 'Notifikasi berhasil dihapus'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in delete_notification: {str(e)}")  # Debug
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
