import os
import sys

# Add the current directory to python path
sys.path.append(os.getcwd())

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("🔧 Updating orders table schema...")
    try:
        # Use raw SQL to add columns if they don't exist
        
        try:
            db.session.execute(text("ALTER TABLE orders ADD COLUMN machine_id VARCHAR(50);"))
            db.session.commit()
            print("✅ Added machine_id column")
        except Exception as e:
            db.session.rollback()
            print(f"ℹ️ machine_id might already exist: {e}")

        try:
            db.session.execute(text("ALTER TABLE orders ADD COLUMN machine_name VARCHAR(100);"))
            db.session.commit()
            print("✅ Added machine_name column")
        except Exception as e:
            db.session.rollback()
            print(f"ℹ️ machine_name might already exist: {e}")
                
        print("✅ Schema update completed!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
