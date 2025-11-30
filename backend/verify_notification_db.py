import os
import sys
import uuid

# Add the current directory to python path
sys.path.append(os.getcwd())

from app import create_app, db
from app.models.notification import Notification
from app.models.user import User

app = create_app()

with app.app_context():
    print("🔧 Verifying Notification Insertion...")
    
    # 1. Find a user
    user = User.query.first()
    if not user:
        print("❌ No users found in database. Cannot test notification.")
        sys.exit(1)
        
    print(f"👤 Found user: {user.name} ({user.id})")
    
    # 2. Create a test notification
    try:
        notif_id = f"TEST-{uuid.uuid4().hex[:12].upper()}"
        notification = Notification(
            id=notif_id,
            user_id=user.id,
            title="Test Notification",
            message="This is a test notification from the verification script.",
            type="info",
            link="dashboard"
        )
        
        db.session.add(notification)
        db.session.commit()
        print(f"✅ Notification created successfully! ID: {notif_id}")
        
        # 3. Verify it exists
        saved_notif = Notification.query.get(notif_id)
        if saved_notif:
            print("✅ Verified: Notification found in database.")
            print(f"   Title: {saved_notif.title}")
            print(f"   Message: {saved_notif.message}")
            
            # Cleanup
            db.session.delete(saved_notif)
            db.session.commit()
            print("🧹 Cleanup: Test notification deleted.")
        else:
            print("❌ Error: Notification not found after commit!")
            
    except Exception as e:
        print(f"❌ Error creating notification: {e}")
        import traceback
        traceback.print_exc()
