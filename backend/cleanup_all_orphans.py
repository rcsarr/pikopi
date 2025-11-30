# cleanup_all_orphans_safe.py
from app import create_app
from app import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("🧹 CLEANING UP ALL ORPHAN DATA")
    print("=" * 60)
    
    tables = ['forum_messages', 'forum_threads', 'forum_replies', 
              'news', 'posts', 'comments', 'notifications']
    
    total = 0
    
    for table in tables:
        try:
            result = db.session.execute(text(f"""
                DELETE FROM {table} 
                WHERE author_id NOT IN (SELECT id::text FROM users)
            """))
            count = result.rowcount
            total += count
            
            if count > 0:
                print(f"✅ {table}: {count} deleted")
            else:
                print(f"✓  {table}: Clean")
            
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            if "does not exist" in str(e):
                print(f"⚠️  {table}: Doesn't exist (OK)")
            else:
                print(f"❌ {table}: {str(e)}")
    
    print("=" * 60)
    print(f"🎉 Total: {total} orphan records deleted")
    print("=" * 60)

print("\n✅ Now run: flask db upgrade")
