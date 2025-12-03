# app/routes/orders.py
from flask import Blueprint, request, jsonify
from app import db
from app.models.order import Order
from app.models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.utils.notifications import create_notification


orders_bp = Blueprint('orders', __name__)


def generate_order_id():
    """Generate unique order ID"""
    try:
        last_order = Order.query.order_by(Order.id.desc()).first()
        if last_order and last_order.id:
            try:
                last_num = int(last_order.id.split('-')[1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1
        
        while True:
            new_id = f'ORD-{str(next_num).zfill(3)}'
            if not Order.query.get(new_id):
                return new_id
            next_num += 1
    except Exception:
        return f'ORD-{str(1).zfill(3)}'


@orders_bp.route('/orders', methods=['POST'])
@jwt_required()
def create_order():
    """Create new order"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)  # ✅ Ambil user untuk get name
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        data = request.get_json()
        
        # Validasi
        required_fields = ['packageName', 'weight', 'price']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Field {field} is required'
                }), 400
        
        # ✅ Parse delivery_date jika ada
        delivery_date = None
        if data.get('deliveryDate'):
            try:
                from datetime import datetime
                delivery_date = datetime.strptime(data['deliveryDate'], '%Y-%m-%d').date()
            except ValueError:
                pass  # Jika format salah, biarkan None
        
        # Buat order baru
        order = Order(
            id=generate_order_id(),
            user_id=current_user_id,
            user_name=user.name,  # ✅ Set dari user object
            package_name=data['packageName'],
            weight=data['weight'],
            price=data['price'],
            status='pending',
            payment_status='unpaid',
            
            # Field opsional
            customer_name=data.get('customerName'),
            customer_phone=data.get('customerPhone'),
            customer_email=data.get('customerEmail'),
            customer_address=data.get('customerAddress'),
            coffee_type=data.get('coffeeType'),
            delivery_date=delivery_date,  # ✅ Gunakan parsed date
            notes=data.get('notes')
        )
        
        db.session.add(order)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Order created successfully',
            'data': order.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to create order: {str(e)}'
        }), 500



@orders_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    """Get all orders"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Admin bisa lihat semua, user hanya miliknya
        if user.role == 'admin':
            orders = Order.query.order_by(Order.created_at.desc()).all()
        else:
            orders = Order.query.filter_by(user_id=current_user_id)\
                .order_by(Order.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [order.to_dict() for order in orders]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch orders: {str(e)}'
        }), 500


@orders_bp.route('/orders/<order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Get single order"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        order = Order.query.get(order_id)
        if not order:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        # Validasi akses
        if user.role != 'admin' and order.user_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        return jsonify({
            'success': True,
            'data': order.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch order: {str(e)}'
        }), 500


@orders_bp.route('/orders/<order_id>/status', methods=['PATCH'])
@jwt_required()
def update_order_status(order_id):
    """Update order status (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        
        data = request.get_json()
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        if 'status' in data:
            order.status = data['status']
            if data['status'] == 'completed':
                order.completed_at = datetime.utcnow()
        
        if 'paymentStatus' in data:
            order.payment_status = data['paymentStatus']
        
        db.session.commit()
        
        # ✅ Send notification
        try:
            create_notification(
                user_id=order.user_id,
                title='Update Status Pesanan',
                message=f'Status pesanan {order.id} telah diperbarui menjadi {order.status}.',
                notification_type='info',
                link='/pesanan'
            )
        except Exception as notif_error:
            print(f"Failed to send notification: {notif_error}")

        return jsonify({
            'success': True,
            'message': 'Order status updated successfully',
            'data': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to update order: {str(e)}'
        }), 500

# Import at top of file needed? No, I can import inside function or add to top.
# Let's add import at the top first in a separate call or just do it here if I can match the top.
# Wait, I should add the import first.

# Tambahkan endpoint baru di akhir file

@orders_bp.route('/orders/<order_id>', methods=['DELETE'])
@jwt_required()
def delete_order(order_id):
    try:
        current_user_id = get_jwt_identity()
        
        # Get order
        order = Order.query.get(order_id)
        if not order:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        # Check ownership
        if order.user_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized'
            }), 403
        
        # ✅ DELETE SORTING RESULTS FIRST
        from app.models.sorting_result import SortingResult
        sorting_results = SortingResult.query.filter_by(order_id=order_id).all()
        for sr in sorting_results:
            db.session.delete(sr)
        
        # ✅ THEN DELETE ORDER
        db.session.delete(order)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Order deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting order: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to delete order: {str(e)}'
        }), 500

@orders_bp.route('/orders/<order_id>/cancel', methods=['PATCH'])
@jwt_required()
def cancel_order(order_id):
    """Cancel order (only if not paid)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        order = Order.query.get(order_id)
        if not order:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        # Validasi akses
        if user.role != 'admin' and order.user_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Tidak bisa cancel jika sudah dibayar atau sudah completed
        if order.payment_status in ['verified', 'pending']:
            return jsonify({
                'success': False,
                'message': 'Cannot cancel order that has been paid or is being verified'
            }), 400
        
        if order.status == 'completed':
            return jsonify({
                'success': False,
                'message': 'Cannot cancel completed order'
            }), 400
        
        # Set status ke cancelled
        order.status = 'cancelled'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Order cancelled successfully',
            'data': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to cancel order: {str(e)}'
        }), 500
