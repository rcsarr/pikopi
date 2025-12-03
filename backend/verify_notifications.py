import sys
import os
sys.path.append(os.getcwd())

from app import create_app, db
from app.models.user import User
from app.models.order import Order
from app.models.sorting_batch import SortingBatch
from app.models.notification import Notification
from app.utils.notifications import create_notification
import uuid
from datetime import datetime

app = create_app()

def verify_notifications():
    with app.app_context():
        print("Starting verification...")
        
        # 1. Get a test user
        user = User.query.first()
        if not user:
            print("No user found in database. Cannot test.")
            return
        
        print(f"Using user: {user.name} ({user.id})")
        
        # 2. Create a test order
        order_id = f"TEST-ORD-{uuid.uuid4().hex[:6].upper()}"
        order = Order(
            id=order_id,
            user_id=user.id,
            user_name=user.name,
            package_name="Test Package",
            weight=10.0,
            price=100000,
            status='pending',
            payment_status='unpaid'
        )
        db.session.add(order)
        db.session.commit()
        print(f"Created test order: {order_id}")
        
        # 3. Simulate Status Update (Trigger Notification)
        print("Updating order status to 'processing'...")
        order.status = 'processing'
        
        try:
            create_notification(
                user_id=order.user_id,
                title='Update Status Pesanan',
                message=f'Status pesanan {order.id} telah diperbarui menjadi {order.status}.',
                notification_type='info',
                link='/pesanan'
            )
            print("Notification trigger executed (simulated)")
        except Exception as e:
            print(f"Failed to trigger notification: {e}")

        # 4. Verify Notification 1
        notif1 = Notification.query.filter_by(user_id=user.id, title='Update Status Pesanan').order_by(Notification.created_at.desc()).first()
        if notif1 and order.id in notif1.message:
            print(f"Notification 1 found: {notif1.title} - {notif1.message}")
        else:
            print("Notification 1 NOT found")

        # 5. Create Batch
        batch_id = f"TEST-BATCH-{uuid.uuid4().hex[:6].upper()}"
        batch = SortingBatch(
            id=batch_id,
            order_id=order_id,
            batch_number=1,
            total_weight=5.0,
            status='pending'
        )
        db.session.add(batch)
        db.session.commit()
        print(f"Created test batch: {batch_id}")

        # 6. Simulate Batch Completion (Trigger Notification)
        print("Completing batch...")
        batch.status = 'completed'
        batch.completed_at = datetime.utcnow()
        batch.total_beans = 1000
        batch.healthy_beans = 900
        batch.defective_beans = 100
        batch.accuracy = 90.0
        db.session.commit()

        try:
            # Logic from batch_routes.py
            user_id = batch.order.user_id
            create_notification(
                user_id=user_id,
                notification_type='batch_completed',
                title='Sortir Selesai',
                message=f'Batch {batch_id} telah selesai disortir. Total: {batch.total_beans or 0} biji kopi.',
                data={
                    'batch_id': batch_id,
                    'total_beans': batch.total_beans,
                    'healthy_beans': batch.healthy_beans or 0,
                    'defective_beans': batch.defective_beans or 0,
                    'accuracy': batch.accuracy or 0
                },
                link='/riwayat'
            )
            print("Batch notification trigger executed (simulated)")
        except Exception as e:
            print(f"Failed to trigger batch notification: {e}")

        # 7. Verify Notification 2
        notif2 = Notification.query.filter_by(user_id=user.id, title='Sortir Selesai').order_by(Notification.created_at.desc()).first()
        if notif2 and batch_id in notif2.message:
            print(f"Notification 2 found: {notif2.title} - {notif2.message}")
        else:
            print("Notification 2 NOT found")

        # Cleanup
        print("Cleaning up...")
        if notif1: db.session.delete(notif1)
        if notif2: db.session.delete(notif2)
        db.session.delete(batch)
        db.session.delete(order)
        db.session.commit()
        print("Cleanup complete")

if __name__ == "__main__":
    verify_notifications()
