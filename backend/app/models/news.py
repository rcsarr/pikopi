from app import db
from datetime import datetime

class News(db.Model):
    __tablename__ = 'news'

    id = db.Column(db.String(50), primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.String(500))
    author_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    author_name = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(20), nullable=False)  # teknologi, tips, berita, tutorial, update
    image_url = db.Column(db.String(500))
    is_published = db.Column(db.Boolean, default=False)
    published_at = db.Column(db.DateTime)
    views_count = db.Column(db.Integer, default=0)
    slug = db.Column(db.String(500), unique=True)
    meta_description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = db.relationship('User', backref='news', lazy=True)

    def to_dict(self):
        """Convert news object to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'excerpt': self.excerpt,
            'authorId': self.author_id,
            'authorName': self.author_name,
            'category': self.category,
            'imageUrl': self.image_url,
            'isPublished': self.is_published,
            'publishedAt': self.published_at.isoformat() if self.published_at else None,
            'viewsCount': self.views_count,
            'slug': self.slug,
            'metaDescription': self.meta_description,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

    def increment_views(self):
        """Increment views count"""
        self.views_count = (self.views_count or 0) + 1
        db.session.commit()

    def __repr__(self):
        return f'<News {self.id}: {self.title}>'

