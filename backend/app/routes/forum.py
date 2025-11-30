from flask import Blueprint, request, jsonify
from app import db
from app.models.forum import ForumThread, ForumMessage, ForumMessageLike
from app.models.notification import Notification
from app.models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import pytz
from sqlalchemy.exc import OperationalError, DisconnectionError
import time
from datetime import timezone
import uuid

JAKARTA_TZ = pytz.timezone('Asia/Jakarta')

def get_jakarta_time():
    return datetime.now(JAKARTA_TZ).replace(tzinfo=None)
forum_bp = Blueprint('forum', __name__)

def generate_thread_id():
    """Generate unique thread ID"""
    try:
        last_thread = ForumThread.query.order_by(ForumThread.id.desc()).first()
        if last_thread and last_thread.id:
            try:
                last_num = int(last_thread.id.split('-')[1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1
        
        while True:
            new_id = f'THR-{str(next_num).zfill(3)}'
            if not ForumThread.query.get(new_id):
                return new_id
            next_num += 1
            
    except Exception:
        return f'THR-{str(1).zfill(3)}'

def generate_message_id():
    """Generate unique message ID"""
    try:
        last_message = ForumMessage.query.order_by(ForumMessage.id.desc()).first()
        if last_message and last_message.id:
            try:
                last_num = int(last_message.id.split('-')[1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1
        
        while True:
            new_id = f'MSG-{str(next_num).zfill(3)}'
            if not ForumMessage.query.get(new_id):
                return new_id
            next_num += 1
            
    except Exception:
        return f'MSG-{str(1).zfill(3)}'

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

# ==================== THREAD ROUTES ====================

@forum_bp.route('/threads', methods=['GET'])
@jwt_required()
def get_threads():
    try:
        limit = request.args.get('limit', 50, type=int)
        search = request.args.get('search', type=str)
        category = request.args.get('category', type=str)
        
        query = ForumThread.query

        # Filter by category
        if category and category != 'Semua':
            query = query.filter(ForumThread.category == category)

        # Filter by search (title or content)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (ForumThread.title.ilike(search_term)) | 
                (ForumThread.content.ilike(search_term))
            )

        threads = query.order_by(
            ForumThread.is_pinned.desc(),
            ForumThread.last_activity.desc()
        ).limit(limit).all()
        
        # ✅ Use to_dict() to ensure consistent timezone handling
        threads_data = [thread.to_dict() for thread in threads]

        return jsonify({
            'success': True,
            'data': threads_data
        }), 200
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@forum_bp.route('/threads/<thread_id>/messages', methods=['GET'])
def get_thread_messages(thread_id):
    """Get all messages in a thread (public endpoint)"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)

        # Find thread
        def find_thread():
            return ForumThread.query.get(thread_id)
        
        thread = execute_with_retry(find_thread)
        
        if not thread:
            return jsonify({
                'success': False,
                'message': 'Thread not found'
            }), 404

        # Increment views (Commented out to prevent bumping thread to top)
        # def increment():
        #     thread.increment_views()
        # 
        # execute_with_retry(increment)

        # Get messages (only root messages, replies will be nested)
        root_messages = ForumMessage.query.filter_by(
            thread_id=thread_id,
            parent_message_id=None
        ).order_by(ForumMessage.created_at.asc()).all()

        # Build nested structure
        messages_data = []
        for msg in root_messages:
            msg_dict = msg.to_dict(include_replies=True)
            # Get replies
            replies = ForumMessage.query.filter_by(parent_message_id=msg.id).order_by(ForumMessage.created_at.asc()).all()
            msg_dict['replies'] = [reply.to_dict() for reply in replies]
            messages_data.append(msg_dict)

        return jsonify({
            'success': True,
            'data': {
                'thread': thread.to_dict(),
                'messages': messages_data,
                'pagination': {
                    'currentPage': page,
                    'totalPages': 1,  # Simplified
                    'totalItems': len(messages_data),
                    'itemsPerPage': limit
                }
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get messages: {str(e)}'
        }), 500

@forum_bp.route('/threads', methods=['POST'])
@jwt_required()
def create_thread():
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        title = data.get('title')
        content = data.get('content')
        category = data.get('category', 'umum')
        
        if not title or not content:
            return jsonify({'success': False, 'message': 'Title and content required'}), 400
        
        thread_id = f"THR-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create thread
        thread = ForumThread(
            id=thread_id,
            title=title,
            content=content,
            author_id=user.id,
            author_name=user.name,
            author_role=user.role,
            category=category,
            messages_count=0,  # ✅ Start with 0, no auto message
            views_count=0
        )
        
        db.session.add(thread)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Thread created successfully',
            'data': {
                'threadId': thread.id,
                'thread': thread.to_dict()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating thread: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@forum_bp.route('/threads/<thread_id>', methods=['DELETE'])
@jwt_required()
def delete_thread(thread_id):
    """Delete thread (only own threads or admin)"""
    try:
        user_id = get_jwt_identity()
        
        # Get user
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404

        # Find thread
        def find_thread():
            return ForumThread.query.get(thread_id)
        
        thread = execute_with_retry(find_thread)
        
        if not thread:
            return jsonify({
                'success': False,
                'message': 'Thread not found'
            }), 404

        # Check permission (only own threads or admin)
        if thread.author_id != user_id and user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        # Delete thread (cascade will delete all messages)
        def delete_thread_func():
            db.session.delete(thread)
            db.session.commit()
        
        execute_with_retry(delete_thread_func)

        return jsonify({
            'success': True,
            'message': 'Thread berhasil dihapus'
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
            'message': f'Failed to delete thread: {str(e)}'
        }), 500

# ==================== MESSAGE ROUTES ====================

@forum_bp.route('/threads/<thread_id>/messages', methods=['POST'])
@jwt_required()
def post_message(thread_id):
    """Post message in a thread"""
    try:
        user_id = get_jwt_identity()
        
        # Get user
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404

        # Find thread
        def find_thread():
            return ForumThread.query.get(thread_id)
        
        thread = execute_with_retry(find_thread)
        
        if not thread:
            return jsonify({
                'success': False,
                'message': 'Thread not found'
            }), 404

        # Check if thread is locked
        if thread.is_locked and user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Thread is locked'
            }), 403

        data = request.get_json()

        if not data.get('content'):
            return jsonify({
                'success': False,
                'message': 'Content is required'
            }), 400

        # Create message
        message = ForumMessage(
            id=generate_message_id(),
            thread_id=thread_id,
            author_id=user_id,
            author_name=user.name,
            author_role=user.role,
            content=data['content'],
            parent_message_id=data.get('parentMessageId')
        )

        # Update thread
        thread.messages_count = (thread.messages_count or 0) + 1
        thread.update_last_activity()

        # Save
        def save_message():
            db.session.add(message)
            db.session.commit()
            return message
        
        saved_message = execute_with_retry(save_message)

        # ✅ NOTIFICATION LOGIC
        try:
            # 1. Notify thread author if someone else commented
            if thread.author_id != user_id:
                notif_id = f"NOTIF-{uuid.uuid4().hex[:12].upper()}"
                notification = Notification(
                    id=notif_id,
                    user_id=thread.author_id,
                    title="Balasan Baru di Forum",
                    message=f"{user.name} membalas thread Anda: {thread.title[:30]}...",
                    type="info",
                    link=f"forum?threadId={thread.id}"
                )
                db.session.add(notification)
            
            # 2. Notify parent message author if this is a reply
            if data.get('parentMessageId'):
                parent_msg = ForumMessage.query.get(data['parentMessageId'])
                if parent_msg and parent_msg.author_id != user_id and parent_msg.author_id != thread.author_id:
                    # Avoid double notification if thread author is same as parent author
                    notif_id = f"NOTIF-{uuid.uuid4().hex[:12].upper()}"
                    notification = Notification(
                        id=notif_id,
                        user_id=parent_msg.author_id,
                        title="Balasan Komentar",
                        message=f"{user.name} membalas komentar Anda di thread: {thread.title[:30]}...",
                        type="info",
                        link=f"forum?threadId={thread.id}"
                    )
                    db.session.add(notification)
            
            db.session.commit()
            print(f"✅ Notification created for thread {thread.id}")
        except Exception as e:
            print(f"⚠️ Failed to create notification in forum: {e}")
            import traceback
            traceback.print_exc()
            # Don't fail the request if notification fails


        return jsonify({
            'success': True,
            'message': 'Pesan berhasil dikirim',
            'data': {
                'messageId': saved_message.id,
                'message': saved_message.to_dict()
            }
        }), 201

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
            'message': f'Failed to post message: {str(e)}'
        }), 500

@forum_bp.route('/messages/<message_id>', methods=['PUT'])
@jwt_required()
def edit_message(message_id):
    """Edit message (only own messages or admin)"""
    try:
        user_id = get_jwt_identity()
        
        # Get user
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404

        # Find message
        def find_message():
            return ForumMessage.query.get(message_id)
        
        message = execute_with_retry(find_message)
        
        if not message:
            return jsonify({
                'success': False,
                'message': 'Message not found'
            }), 404

        # Check permission (only own messages or admin)
        if message.author_id != user_id and user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        data = request.get_json()

        if not data.get('content'):
            return jsonify({
                'success': False,
                'message': 'Content is required'
            }), 400

        # Update message
        message.content = data['content']
        message.is_edited = True
        message.edited_at = get_jakarta_time()
        # Save
        def save_message():
            db.session.commit()
            return message
        
        execute_with_retry(save_message)

        return jsonify({
            'success': True,
            'message': 'Pesan berhasil diperbarui',
            'data': message.to_dict()
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
            'message': f'Failed to edit message: {str(e)}'
        }), 500

@forum_bp.route('/messages/<message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """Delete message (only own messages or admin)"""
    try:
        user_id = get_jwt_identity()
        
        # Get user
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404

        # Find message
        def find_message():
            return ForumMessage.query.get(message_id)
        
        message = execute_with_retry(find_message)
        
        if not message:
            return jsonify({
                'success': False,
                'message': 'Message not found'
            }), 404

        # Check permission (only own messages or admin)
        if message.author_id != user_id and user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        thread_id = message.thread_id

        # Delete message
        def delete_message():
            db.session.delete(message)
            # Update thread message count
            thread = ForumThread.query.get(thread_id)
            if thread:
                thread.messages_count = max(0, (thread.messages_count or 0) - 1)
                thread.update_last_activity()
            db.session.commit()
        
        execute_with_retry(delete_message)

        return jsonify({
            'success': True,
            'message': 'Pesan berhasil dihapus'
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
            'message': f'Failed to delete message: {str(e)}'
        }), 500

# ==================== LIKE ROUTES ====================

@forum_bp.route('/messages/<message_id>/like', methods=['POST'])
@jwt_required()
def like_message(message_id):
    """Like/unlike a message"""
    try:
        user_id = get_jwt_identity()
        
        # Find message
        def find_message():
            return ForumMessage.query.get(message_id)
        
        message = execute_with_retry(find_message)
        
        if not message:
            return jsonify({
                'success': False,
                'message': 'Message not found'
            }), 404

        # Check if already liked
        existing_like = ForumMessageLike.query.filter_by(
            message_id=message_id,
            user_id=user_id
        ).first()

        if existing_like:
            # Unlike
            def unlike():
                db.session.delete(existing_like)
                message.decrement_likes()
                db.session.commit()
            
            execute_with_retry(unlike)
            
            return jsonify({
                'success': True,
                'message': 'Pesan berhasil di-unlike',
                'data': {
                    'messageId': message_id,
                    'likesCount': message.likes_count,
                    'isLiked': False
                }
            }), 200
        else:
            # Like
            like = ForumMessageLike(
                message_id=message_id,
                user_id=user_id
            )

            def save_like():
                db.session.add(like)
                message.increment_likes()
                db.session.commit()
                return like
            
            execute_with_retry(save_like)
            
            return jsonify({
                'success': True,
                'message': 'Pesan berhasil di-like',
                'data': {
                    'messageId': message_id,
                    'likesCount': message.likes_count,
                    'isLiked': True
                }
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
            'message': f'Failed to like message: {str(e)}'
        }), 500

# ==================== ADMIN ROUTES ====================

@forum_bp.route('/admin/threads/<thread_id>/pin', methods=['POST'])
@jwt_required()
def pin_thread(thread_id):
    """Pin/unpin thread (Admin only)"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Access denied. Admin only.'
            }), 403

        # Find thread
        def find_thread():
            return ForumThread.query.get(thread_id)
        
        thread = execute_with_retry(find_thread)
        
        if not thread:
            return jsonify({
                'success': False,
                'message': 'Thread not found'
            }), 404

        # Toggle pin
        thread.is_pinned = not thread.is_pinned

        def save_thread():
            db.session.commit()
            return thread
        
        execute_with_retry(save_thread)

        return jsonify({
            'success': True,
            'message': f'Thread berhasil di-{"pin" if thread.is_pinned else "unpin"}',
            'data': thread.to_dict()
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
            'message': f'Failed to pin thread: {str(e)}'
        }), 500

@forum_bp.route('/admin/threads/<thread_id>/lock', methods=['POST'])
@jwt_required()
def lock_thread(thread_id):
    """Lock/unlock thread (Admin only)"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Access denied. Admin only.'
            }), 403

        # Find thread
        def find_thread():
            return ForumThread.query.get(thread_id)
        
        thread = execute_with_retry(find_thread)
        
        if not thread:
            return jsonify({
                'success': False,
                'message': 'Thread not found'
            }), 404

        # Toggle lock
        thread.is_locked = not thread.is_locked

        def save_thread():
            db.session.commit()
            return thread
        
        execute_with_retry(save_thread)

        return jsonify({
            'success': True,
            'message': f'Thread berhasil di-{"lock" if thread.is_locked else "unlock"}',
            'data': thread.to_dict()
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
            'message': f'Failed to lock thread: {str(e)}'
        }), 500

