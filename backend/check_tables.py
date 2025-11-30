"""
Script to check if all required tables exist in the database
"""
from app import create_app, db

def check_tables():
    """Check if all required tables exist"""
    app = create_app()
    
    required_tables = [
        'users',
        'news',
        'forum_threads',
        'forum_messages',
        'forum_message_likes',
        'notifications'
    ]
    
    with app.app_context():
        try:
            inspector = db.inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            print("📋 Database Tables Status:\n")
            
            all_exist = True
            for table in required_tables:
                if table in existing_tables:
                    print(f"   ✅ {table}")
                else:
                    print(f"   ❌ {table} - MISSING")
                    all_exist = False
            
            if all_exist:
                print("\n✅ All required tables exist!")
            else:
                print("\n⚠️  Some tables are missing. Run create_tables.py to create them.")
            
            # Show additional tables if any
            additional = [t for t in existing_tables if t not in required_tables]
            if additional:
                print(f"\n📦 Additional tables found ({len(additional)}):")
                for table in sorted(additional):
                    print(f"   - {table}")
            
        except Exception as e:
            print(f"❌ Error checking tables: {str(e)}")
            raise

if __name__ == '__main__':
    check_tables()

