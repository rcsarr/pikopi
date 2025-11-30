"""
Script to create all database tables
Run this script to ensure all tables are created in the database
"""
from app import create_app, db
from app.models.user import User
from app.models.news import News
from app.models.forum import ForumThread, ForumMessage, ForumMessageLike
from app.models.notification import Notification

def create_all_tables():
    """Create all database tables"""
    app = create_app()
    
    with app.app_context():
        try:
            print("📦 Creating database tables...")
            db.create_all()
            print("✅ All tables created successfully!")
            
            # List all tables
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"\n📋 Created tables ({len(tables)}):")
            for table in sorted(tables):
                print(f"   - {table}")
            
        except Exception as e:
            print(f"❌ Error creating tables: {str(e)}")
            raise

if __name__ == '__main__':
    create_all_tables()

