import os
import sys

# Add the current directory to python path
sys.path.append(os.getcwd())

from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    print("🔧 Updating users table schema...")
    try:
        # Use raw SQL to modify the column type
        db.engine.execute("ALTER TABLE users ALTER COLUMN profile_image TYPE TEXT;")
        print("✅ Successfully updated profile_image column to TEXT!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Note: If the column doesn't exist, this is expected. The column will be created when you run migrations.")
