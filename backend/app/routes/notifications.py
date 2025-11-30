from flask import Blueprint, request, jsonify
from app import db
from app.models.notification import Notification
from app.models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy.exc import OperationalError, DisconnectionError
import time

notifications_bp = Blueprint('notifications', __name__)

def generate_notification_id():
    """Generate unique notification ID"""
    try:
        last_notif = Notification.query.order_by(Notification.id.desc()).first()
        if last_notif and last_notif.id:
            try:
                last_num = int(last_notif.id.split('-')[1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1

        while True:
            new_id = f'NOTIF-{str(next_num).zfill(3)}'
            if not Notification.query.get(new_id):
                return new_id
            next_num += 1
    except Exception:
        return f'NOTIF-{str(1).zfill(3)}'

def execute_with_retry(func, max_retries=3):
    """Execute database operation with retry logic"""
    for attempt in range(max_retries):
        try:
            return func()
        except (OperationalError, DisconnectionError) as e:
            if attempt < max_retries - 1:
                error_msg = str(e).lower()
                if "server closed the connection" in error_msg or "connection" in error_msg:
                    wait_time = (attempt + 1) * 0.5
                    time.sleep(wait_time)
                    db.session.rollback()
                    continue
            raise
        except Exception:
            raise

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user notifications"""
    try:
        user_id = get_jwt_identity()
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        unread_only = request.args.get('unreadOnly', 'false').lower() == 'true'

        # Build query
        query = Notification.query.filter_by(user_id=user_id)

        # Filter unread only
        if unread_only:
            query = query.filter_by(is_read=False)

        # Order by created_at desc
        query = query.order_by(Notification.created_at.desc())

        # Pagination
        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        
        notifications_list = [notif.to_dict() for notif in pagination.items]

        # Get unread count
        unread_count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).count()

        return jsonify({
            'success': True,
            'data': {
                'notifications': notifications_list,
                'unreadCount': unread_count,
                'pagination': {
                    'currentPage': page,
                    'totalPages': pagination.pages,
                    'totalItems': pagination.total,
                    'itemsPerPage': limit
                }
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get notifications: {str(e)}'
        }), 500

@notifications_bp.route('/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark notification as read"""
    try:
        user_id = get_jwt_identity()
        
        # Find notification
        def find_notification():
            return Notification.query.get(notification_id)
        
        notification = execute_with_retry(find_notification)
        
        if not notification:
            return jsonify({
                'success': False,
                'message': 'Notification not found'
            }), 404

        # Check ownership
        if notification.user_id != user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        # Mark as read
        def mark_read():
            notification.mark_as_read()
        
        execute_with_retry(mark_read)

        return jsonify({
            'success': True,
            'message': 'Notifikasi ditandai sudah dibaca',
            'data': notification.to_dict()
        }), 200

    except (OperationalError, DisconnectionError) as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database connection error. Please try again.'
        }), 503
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to mark notification as read: {str(e)}'
        }), 500

@notifications_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read"""
    try:
        user_id = get_jwt_identity()
        
        # Find all unread notifications
        def mark_all_read():
            unread_notifications = Notification.query.filter_by(
                user_id=user_id,
                is_read=False
            ).all()
            
            for notification in unread_notifications:
                notification.mark_as_read()
            
            db.session.commit()
            return len(unread_notifications)
        
        count = execute_with_retry(mark_all_read)

        return jsonify({
            'success': True,
            'message': f'Semua notifikasi ({count}) ditandai sudah dibaca'
        }), 200

    except (OperationalError, DisconnectionError) as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database connection error. Please try again.'
        }), 503
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to mark all notifications as read: {str(e)}'
        }), 500

@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        user_id = get_jwt_identity()
        
        # Find notification
        def find_notification():
            return Notification.query.get(notification_id)
        
        notification = execute_with_retry(find_notification)
        
        if not notification:
            return jsonify({
                'success': False,
                'message': 'Notification not found'
            }), 404

        # Check ownership
        if notification.user_id != user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        # Delete notification
        def delete_notif():
            db.session.delete(notification)
            db.session.commit()
        
        execute_with_retry(delete_notif)

        return jsonify({
            'success': True,
            'message': 'Notifikasi berhasil dihapus'
        }), 200

    except (OperationalError, DisconnectionError) as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database connection error. Please try again.'
        }), 503
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to delete notification: {str(e)}'
        }), 500

