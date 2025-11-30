"""
Migration script to change profile_image column from VARCHAR(500) to TEXT
This fixes the error when saving large base64-encoded profile images.
"""

from app import app, db
from sqlalchemy import text

def migrate_profile_image_column():
    """Alter profile_image column from VARCHAR(500) to TEXT"""
    with app.app_context():
        try:
            # Check current column type
            print("Checking current column type...")
            result = db.session.execute(text("""
                SELECT data_type, character_maximum_length 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'profile_image';
            """))
            
            row = result.fetchone()
            if row:
                print(f"Current type: {row[0]}, Max length: {row[1]}")
            else:
                print("Column not found!")
                return
            
            # Alter column to TEXT
            print("\nAltering column to TEXT...")
            db.session.execute(text("""
                ALTER TABLE users 
                ALTER COLUMN profile_image TYPE TEXT;
            """))
            
            # Commit changes
            db.session.commit()
            print("✅ Migration successful!")
            
            # Verify the change
            result = db.session.execute(text("""
                SELECT data_type, character_maximum_length 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'profile_image';
            """))
            
            row = result.fetchone()
            print(f"New type: {row[0]}, Max length: {row[1]}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            db.session.rollback()

if __name__ == "__main__":
    print("=" * 60)
    print("Profile Image Column Migration")
    print("=" * 60)
    migrate_profile_image_column()
    print("=" * 60)
