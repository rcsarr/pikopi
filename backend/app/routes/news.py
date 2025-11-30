from flask import Blueprint, request, jsonify
from app import db
from app.models.news import News
from app.models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import datetime
import re
from sqlalchemy.exc import OperationalError, DisconnectionError
import time
from sqlalchemy import or_, desc 

news_bp = Blueprint('news', __name__)

def generate_news_id():
    """Generate unique news ID"""
    try:
        last_news = News.query.order_by(News.id.desc()).first()
        if last_news and last_news.id:
            try:
                # Handle both 'NEWS-001' and 'news-001' format
                last_num = int(last_news.id.split('-')[1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1
            
        while True:
            new_id = f'news-{str(next_num).zfill(3)}'
            if not News.query.get(new_id):
                return new_id
            next_num += 1
    except Exception:
        return f'news-001'

def generate_slug(title):
    """Generate URL-friendly slug from title"""
    slug = title.lower()
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    
    base_slug = slug
    counter = 1
    while News.query.filter_by(slug=slug).first():
        slug = f'{base_slug}-{counter}'
        counter += 1
    
    return slug

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

@news_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def get_all_news():
    """Get all news (published for public, all for admin)"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 100, type=int)
        category = request.args.get('category', 'all')
        search = request.args.get('search', '')
        status_filter = request.args.get('status', 'all')
        include_drafts = request.args.get('includeDrafts', 'false').lower() == 'true'
        
        # Get user if authenticated
        user_id = None
        user = None
        try:
            user_id = get_jwt_identity()
            if user_id:
                def find_user():
                    return User.query.get(user_id)
                user = execute_with_retry(find_user)
        except Exception:
            pass  # Not authenticated or JWT error
        
        # Build query
        query = News.query
        
        # Admin can see all news (including drafts), public only published
        if not (user and user.role == 'admin' and include_drafts):
            query = query.filter_by(is_published=True)
        
        # Filter by status (for admin)
        if status_filter == 'published':
            query = query.filter_by(is_published=True)
        elif status_filter == 'draft':
            query = query.filter_by(is_published=False)
        
        # Filter by category
        if category and category != 'all':
            query = query.filter_by(category=category)
        
        # Search
        if search:
            query = query.filter(
                or_(
                    News.title.ilike(f'%{search}%'),
                    News.content.ilike(f'%{search}%'),
                    News.excerpt.ilike(f'%{search}%')
                )
            )
        
        # Order by published_at desc (nulls last)
        query = query.order_by(News.published_at.desc().nullslast())
        
        # Get results with limit (no pagination for now to match frontend expectation)
        news_items = query.limit(limit).all()
        
        # Format response to match frontend interface
        news_list = []
        for news in news_items:
            news_list.append({
                'id': news.id,
                'title': news.title,
                'content': news.content,
                'excerpt': news.excerpt,
                'imageUrl': news.image_url,
                'publishedAt': news.published_at.isoformat() if news.published_at else None,
                'authorName': news.author_name,
                'isPublished': news.is_published,
                'category': news.category,
                'viewsCount': news.views_count,
                'createdAt': news.created_at.isoformat() if news.created_at else None,
                'updatedAt': news.updated_at.isoformat() if news.updated_at else None
            })
        
        # Return standardized response
        return jsonify({
            'success': True,
            'data': {
                'news': news_list,
                'pagination': {
                    'currentPage': page,
                    'totalPages': 1, # TODO: Implement real pagination if needed
                    'totalItems': len(news_list),
                    'itemsPerPage': limit
                }
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_all_news: {str(e)}")  # For debugging
        return jsonify({
            'success': False,
            'message': f'Failed to get news: {str(e)}'
        }), 500

@news_bp.route('/<news_id>', methods=['GET'])
def get_news_detail(news_id):
    """Get news detail by ID or slug (public endpoint)"""
    try:
        # Try to find by ID first, then by slug
        news = News.query.get(news_id)
        if not news:
            news = News.query.filter_by(slug=news_id).first()
        
        if not news:
            return jsonify({
                'success': False,
                'message': 'News not found'
            }), 404
        
        # Only return published news for public
        # Note: We might want to allow admins to see drafts via this endpoint too if they have a token, 
        # but for now let's keep it simple or check for token if needed.
        # The frontend NewsManagement uses a different flow (it has the data already or could use this).
        # But usually public view is strictly published only.
        if not news.is_published:
             # Check if admin is requesting (optional, but good for preview)
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            is_admin = False
            if user_id:
                user = User.query.get(user_id)
                if user and user.role == 'admin':
                    is_admin = True
            
            if not is_admin:
                return jsonify({
                    'success': False,
                    'message': 'News not found'
                }), 404
        
        # Increment views
        try:
            news.views_count = (news.views_count or 0) + 1
            db.session.commit()
        except Exception as e:
            print(f"Error incrementing views: {str(e)}")
            db.session.rollback()
        
        return jsonify({
            'success': True,
            'data': {
                'id': news.id,
                'title': news.title,
                'content': news.content,
                'excerpt': news.excerpt,
                'imageUrl': news.image_url,
                'publishedAt': news.published_at.isoformat() if news.published_at else None,
                'authorName': news.author_name,
                'isPublished': news.is_published,
                'category': news.category,
                'viewsCount': news.views_count,
                'createdAt': news.created_at.isoformat() if news.created_at else None,
                'updatedAt': news.updated_at.isoformat() if news.updated_at else None
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_news_detail: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to get news: {str(e)}'
        }), 500

@news_bp.route('', methods=['POST'])
@jwt_required()
def create_news():
    """Create new news article (Admin only)"""
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
        
        data = request.get_json()
        
        # Validation
        if not data.get('title') or not data.get('content'):
            return jsonify({
                'success': False,
                'message': 'Title and content are required'
            }), 400
        
        # Generate slug
        slug = generate_slug(data['title'])
        
        # Create news
        news = News(
            id=generate_news_id(),
            title=data['title'],
            content=data['content'],
            excerpt=data.get('excerpt', ''),
            author_id=user_id,
            author_name=user.name,
            category=data.get('category', 'Berita Utama'),
            image_url=data.get('imageUrl'),
            is_published=data.get('isPublished', False),
            slug=slug,
            meta_description=data.get('metaDescription'),
            views_count=0
        )
        
        # Set published_at if publishing
        if news.is_published:
            news.published_at = datetime.utcnow()
        
        # Save
        def save_news():
            db.session.add(news)
            db.session.commit()
            return news
        
        saved_news = execute_with_retry(save_news)
        
        return jsonify({
            'success': True,
            'message': 'News berhasil dibuat',
            'data': {
                'id': saved_news.id,
                'title': saved_news.title,
                'content': saved_news.content,
                'excerpt': saved_news.excerpt,
                'imageUrl': saved_news.image_url,
                'publishDate': saved_news.published_at.isoformat() if saved_news.published_at else None,
                'author': saved_news.author_name,
                'status': 'published' if saved_news.is_published else 'draft',
                'category': saved_news.category
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
        print(f"Error in create_news: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to create news: {str(e)}'
        }), 500

@news_bp.route('/<news_id>', methods=['PUT'])
@jwt_required()
def update_news(news_id):
    """Update news article (Admin only)"""
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
        
        # Find news
        def find_news():
            return News.query.get(news_id)
        news = execute_with_retry(find_news)
        
        if not news:
            return jsonify({
                'success': False,
                'message': 'News not found'
            }), 404
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            news.title = data['title']
            news.slug = generate_slug(data['title'])
        
        if 'content' in data:
            news.content = data['content']
        
        if 'excerpt' in data:
            news.excerpt = data['excerpt']
        
        if 'category' in data:
            news.category = data['category']
        
        if 'imageUrl' in data:
            news.image_url = data['imageUrl']
        
        if 'isPublished' in data:
            was_published = news.is_published
            news.is_published = data['isPublished']
            
            # Set published_at if publishing for the first time
            if data['isPublished'] and not was_published:
                news.published_at = datetime.utcnow()
        
        if 'metaDescription' in data:
            news.meta_description = data['metaDescription']
        
        news.updated_at = datetime.utcnow()
        
        # Save
        def save_news():
            db.session.commit()
            return news
        
        execute_with_retry(save_news)
        
        return jsonify({
            'success': True,
            'message': 'News berhasil diperbarui',
            'data': {
                'id': news.id,
                'title': news.title,
                'content': news.content,
                'excerpt': news.excerpt,
                'imageUrl': news.image_url,
                'publishDate': news.published_at.isoformat() if news.published_at else None,
                'author': news.author_name,
                'status': 'published' if news.is_published else 'draft',
                'category': news.category
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
        print(f"Error in update_news: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to update news: {str(e)}'
        }), 500

@news_bp.route('/<news_id>', methods=['DELETE'])
@jwt_required()
def delete_news(news_id):
    """Delete news article (Admin only)"""
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
        
        # Find news
        def find_news():
            return News.query.get(news_id)
        news = execute_with_retry(find_news)
        
        if not news:
            return jsonify({
                'success': False,
                'message': 'News not found'
            }), 404
        
        # Delete
        def delete_item():
            db.session.delete(news)
            db.session.commit()
        
        execute_with_retry(delete_item)
        
        return jsonify({
            'success': True,
            'message': 'News berhasil dihapus'
        }), 200
        
    except (OperationalError, DisconnectionError) as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database connection error. Please try again.'
        }), 503
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_news: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to delete news: {str(e)}'
        }), 500
