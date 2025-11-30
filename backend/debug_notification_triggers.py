import os
import sys
import uuid

# Add the current directory to python path
sys.path.append(os.getcwd())

from app import create_app, db
from app.models.notification import Notification
from app.models.user import User
from app.models.order import Order
from app.models.sorting_batch import SortingBatch

app = create_app()

with app.app_context():
    print("🔧 Debugging Notification Triggers...")
    
    # 1. Find a user and an order
    user = User.query.first()
    if not user:
        print("❌ No users found.")
        sys.exit(1)
        
    print(f"👤 User: {user.name} ({user.id})")
    
    # Create a dummy order if needed
    order = Order.query.filter_by(user_id=user.id).first()
    if not order:
        print("⚠️ No order found for user. Creating dummy order...")
        order = Order(
            id=f"ORD-TEST-{uuid.uuid4().hex[:6]}",
            user_id=user.id,
            package_name="Test Package",
            weight=1.0,
            price=100000,
            status='pending'
        )
        db.session.add(order)
        db.session.commit()
        print(f"✅ Created dummy order: {order.id}")
    else:
        print(f"📦 Found order: {order.id}")

    # 2. Simulate Batch Completion Notification
    print("\n🧪 Simulating Batch Completion Notification...")
    try:
        # Create dummy batch
        batch_id = f"BATCH-TEST-{uuid.uuid4().hex[:6]}"
        batch = SortingBatch(
            id=batch_id,
            order_id=order.id,
            batch_number=999,
            total_weight=10,
            status='processing'
        )
        db.session.add(batch)
        db.session.commit()
        
        # --- LOGIC FROM batch_routes.py ---
        # Get order to find owner
        target_order = Order.query.get(batch.order_id)
        if target_order:
            print(f"   Found order owner: {target_order.user_id}")
            notif_id = f"NOTIF-BATCH-{uuid.uuid4().hex[:8].upper()}"
            notification = Notification(
                id=notif_id,
                user_id=target_order.user_id,
                title="Batch Selesai (TEST)",
                message=f"Batch #{batch.batch_number} selesai.",
                type="success",
                link=f"riwayat?batchId={batch.id}"
            )
            db.session.add(notification)
            db.session.commit()
            print(f"✅ Notification added to session and committed. ID: {notif_id}")
            
            # Verify
            saved = Notification.query.get(notif_id)
            if saved:
                print("✅ Verified: Notification exists in DB.")
            else:
                print("❌ Error: Notification NOT found in DB.")
        else:
            print("❌ Error: Order not found for batch.")
            
        # Cleanup
        db.session.delete(batch)
        if saved: db.session.delete(saved)
        db.session.commit()
        
    except Exception as e:
        print(f"❌ Exception during simulation: {e}")
        import traceback
        traceback.print_exc()

    print("\n🏁 Debugging Complete.")
