from app import db
from app.models.notification import Notification
import uuid

def create_notification(user_id, title, message, notification_type='info', data=None, link=None):
    """
    Create a new notification
    
    Args:
        user_id (str): ID of the user to notify
        title (str): Notification title
        message (str): Notification message body
        notification_type (str): Type of notification (info, success, warning, error)
        data (dict, optional): Additional data (not stored in DB currently)
        link (str, optional): Link to related resource
    """
    try:
        # Generate ID
        notification_id = f"NOTIF-{uuid.uuid4().hex[:12].upper()}"
        
        # Map 'batch_completed' to 'success' or keep as is if frontend handles it
        # The model comment says: info, success, warning, error
        # But let's keep what's passed if it makes sense, or default to info
        
        valid_types = ['info', 'success', 'warning', 'error']
        db_type = notification_type if notification_type in valid_types else 'info'
        
        # If it's batch_completed, maybe we want 'success' type visually?
        if notification_type == 'batch_completed':
            db_type = 'success'
            
        notification = Notification(
            id=notification_id,
            user_id=user_id,
            title=title,
            message=message,
            type=db_type,
            link=link
        )
        
        db.session.add(notification)
        db.session.commit()
        return notification
        
    except Exception as e:
        print(f"Failed to create notification: {e}")
        # Don't raise error to avoid breaking the main flow
        db.session.rollback()
        return None
