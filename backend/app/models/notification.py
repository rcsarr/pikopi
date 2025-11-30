from app import db
from datetime import datetime
import pytz

JAKARTA_TZ = pytz.timezone('Asia/Jakarta')

def jakarta_now():
    return datetime.now(JAKARTA_TZ).replace(tzinfo=None)

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='info')  # info, success, warning, error
    is_read = db.Column(db.Boolean, default=False)
    link = db.Column(db.String(255))  # Optional link to related page
    created_at = db.Column(db.DateTime, default=jakarta_now)

    # Relationship
    user = db.relationship('User', backref=db.backref('notifications', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'isRead': self.is_read,
            'link': self.link,
            'createdAt': JAKARTA_TZ.localize(self.created_at).isoformat() if self.created_at else None
        }

    def mark_as_read(self):
        """Mark this notification as read"""
        self.is_read = True
        db.session.commit()
