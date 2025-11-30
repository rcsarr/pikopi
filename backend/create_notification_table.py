import os
import sys

# Add the current directory to python path
sys.path.append(os.getcwd())

from app import create_app, db
from app.models.notification import Notification

app = create_app()

with app.app_context():
    print("🔧 Creating notifications table...")
    try:
        # Create specific table
        Notification.__table__.create(db.engine)
        print("✅ Table 'notifications' created successfully!")
            
    except Exception as e:
        print(f"❌ Error creating table: {e}")
