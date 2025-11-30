from concurrent.futures import thread
from app import db
from datetime import datetime
from datetime import datetime
import pytz

JAKARTA_TZ = pytz.timezone('Asia/Jakarta')
def jakarta_now():
    return datetime.now(JAKARTA_TZ).replace(tzinfo=None)

class ForumThread(db.Model):
    __tablename__ = 'forum_threads'

    id = db.Column(db.String(50), primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    content = db.Column(db.Text)
    author_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    author_name = db.Column(db.String(255), nullable=False)
    author_role = db.Column(db.String(10), nullable=False)  # admin, user
    category = db.Column(db.String(20), nullable=False)  # umum, tutorial, tanya_jawab, troubleshooting, feedback
    is_pinned = db.Column(db.Boolean, default=False)
    is_locked = db.Column(db.Boolean, default=False)
    messages_count = db.Column(db.Integer, default=0)
    views_count = db.Column(db.Integer, default=0)
    last_activity = db.Column(db.DateTime, default=jakarta_now)
    created_at = db.Column(db.DateTime, default=jakarta_now)
    updated_at = db.Column(db.DateTime, default=jakarta_now, onupdate=jakarta_now)
    last_activity = db.Column(db.DateTime, default=jakarta_now)
    # Relationships
    author = db.relationship('User', backref='forum_threads', lazy=True)
    messages = db.relationship('ForumMessage', backref='thread', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        """Convert forum thread object to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'authorId': self.author_id,
            'authorName': self.author_name,
            'authorRole': self.author_role,
            'category': self.category,
            'isPinned': self.is_pinned,
            'isLocked': self.is_locked,
            'messagesCount': ForumMessage.query.filter_by(thread_id=self.id).count(),
            'viewsCount': self.views_count,
            'lastActivity': JAKARTA_TZ.localize(self.last_activity).isoformat() if self.last_activity else None,
            'createdAt': JAKARTA_TZ.localize(self.created_at).isoformat() if self.created_at else None,
            'updatedAt': JAKARTA_TZ.localize(self.updated_at).isoformat() if self.updated_at else None
        }

    def increment_views(self):
        """Increment views count"""
        self.views_count = (self.views_count or 0) + 1
        db.session.commit()

    def update_last_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()
        db.session.commit()

    def __repr__(self):
        return f'<ForumThread {self.id}: {self.title}>'


class ForumMessage(db.Model):
    __tablename__ = 'forum_messages'

    id = db.Column(db.String(50), primary_key=True)
    thread_id = db.Column(db.String(50), db.ForeignKey('forum_threads.id', ondelete='CASCADE'), nullable=False)
    author_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    author_name = db.Column(db.String(255), nullable=False)
    author_role = db.Column(db.String(10), nullable=False)  # admin, user
    content = db.Column(db.Text, nullable=False)
    parent_message_id = db.Column(db.String(50), db.ForeignKey('forum_messages.id', ondelete='CASCADE'))
    likes_count = db.Column(db.Integer, default=0)
    is_edited = db.Column(db.Boolean, default=False)
    edited_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=jakarta_now)
    updated_at = db.Column(db.DateTime, default=jakarta_now, onupdate=jakarta_now)
    # Relationships
    author = db.relationship('User', backref='forum_messages', lazy=True)
    parent_message = db.relationship('ForumMessage', remote_side=[id], backref='replies')
    likes = db.relationship('ForumMessageLike', backref='message', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_replies=False):
        """Convert forum message object to dictionary"""
        data = {
            'id': self.id,
            'threadId': self.thread_id,
            'authorId': self.author_id,
            'authorName': self.author_name,
            'authorRole': self.author_role,
            'content': self.content,
            'parentMessageId': self.parent_message_id,
            'likesCount': self.likes_count,
            'isEdited': self.is_edited,
            'editedAt': JAKARTA_TZ.localize(self.edited_at).isoformat() if self.edited_at else None,
            'createdAt': JAKARTA_TZ.localize(self.created_at).isoformat() if self.created_at else None,
            'updatedAt': JAKARTA_TZ.localize(self.updated_at).isoformat() if self.updated_at else None
        }
        
        if include_replies and self.replies:
            data['replies'] = [reply.to_dict() for reply in self.replies]
        
        return data

    def increment_likes(self):
        """Increment likes count"""
        self.likes_count = (self.likes_count or 0) + 1
        db.session.commit()

    def decrement_likes(self):
        """Decrement likes count"""
        if self.likes_count > 0:
            self.likes_count -= 1
            db.session.commit()

    def __repr__(self):
        return f'<ForumMessage {self.id}>'


class ForumMessageLike(db.Model):
    __tablename__ = 'forum_message_likes'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    message_id = db.Column(db.String(50), db.ForeignKey('forum_messages.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='forum_message_likes', lazy=True)

    __table_args__ = (
        db.UniqueConstraint('message_id', 'user_id', name='unique_message_like'),
    )

    def to_dict(self):
        """Convert like object to dictionary"""
        return {
            'id': self.id,
            'messageId': self.message_id,
            'userId': self.user_id,
            'createdAt': JAKARTA_TZ.localize(self.created_at).isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<ForumMessageLike {self.id}: msg={self.message_id}, user={self.user_id}>'

