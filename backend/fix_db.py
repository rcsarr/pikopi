import os
import sys

# Add the current directory to python path
sys.path.append(os.getcwd())

from app import create_app, db
from app.models.forum import ForumThread, ForumMessage, ForumMessageLike

app = create_app()

with app.app_context():
    print("🔧 Checking database tables...")
    try:
        # Create all tables
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Verify if table exists
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        if 'forum_message_likes' in tables:
            print("✅ Table 'forum_message_likes' exists!")
        else:
            print("❌ Table 'forum_message_likes' MISSING!")
            
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
