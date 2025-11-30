from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.order import Order
from app.models.payment import Payment
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import OperationalError, DisconnectionError
from sqlalchemy import or_, func
from datetime import datetime, timedelta
import time

admin_bp = Blueprint('admin', __name__)

# ========================================
# HELPER FUNCTIONS
# ========================================

def execute_with_retry(func, max_retries=3):
    """Execute database operation with retry logic"""
    for attempt in range(max_retries):
        try:
            return func()
        except (OperationalError, DisconnectionError) as e:
            if attempt == max_retries - 1:
                raise
            error_msg = str(e).lower()
            if 'server closed the connection' in error_msg or 'connection' in error_msg:
                wait_time = (attempt + 1) * 0.5
                time.sleep(wait_time)
                db.session.rollback()
                continue
            raise
        except Exception:
            raise

def check_admin():
    """Helper function to check if user is admin"""
    user_id = get_jwt_identity()
    
    def find_user():
        return User.query.get(user_id)
    
    user = execute_with_retry(find_user)
    
    if not user or user.role != 'admin':
        return None
    
    return user

# ========================================
# PERFORMANCE METRICS ENDPOINT
# ========================================

@admin_bp.route('/performance', methods=['GET'])
@jwt_required()
def get_performance():
    """Get performance metrics for admin dashboard"""
    try:
        admin_user = check_admin()
        if not admin_user:
            return jsonify({
                'success': False,
                'message': 'Access denied. Admin only.'
            }), 403
        
        # Get date range (default: last 30 days)
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Total users
        total_users = User.query.count()
        new_users = User.query.filter(User.created_at >= start_date).count()
        
        # Total orders
        total_orders = Order.query.count() if hasattr(db, 'Model') and 'orders' in db.metadata.tables else 0
        pending_orders = Order.query.filter_by(status='pending').count() if total_orders > 0 else 0
        processing_orders = Order.query.filter_by(status='processing').count() if total_orders > 0 else 0
        completed_orders = Order.query.filter_by(status='completed').count() if total_orders > 0 else 0
        
        # Revenue statistics
        try:
            total_revenue = db.session.query(func.sum(Payment.amount)).filter(
                Payment.status == 'completed'
            ).scalar() or 0
            
            monthly_revenue = db.session.query(func.sum(Payment.amount)).filter(
                Payment.status == 'completed',
                Payment.created_at >= start_date
            ).scalar() or 0
        except:
            total_revenue = 0
            monthly_revenue = 0
        
        # Order trends (last 7 days)
        order_trends = []
        for i in range(7):
            date = datetime.utcnow() - timedelta(days=6-i)
            date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            date_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            try:
                count = Order.query.filter(
                    Order.created_at >= date_start,
                    Order.createdat <= date_end
                ).count()
            except:
                count = 0
            
            order_trends.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': count
            })
        
        # Payment status distribution
        try:
            payment_stats = {
                'completed': Payment.query.filter_by(status='completed').count(),
                'pending': Payment.query.filter_by(status='pending').count(),
                'failed': Payment.query.filter_by(status='failed').count(),
            }
        except:
            payment_stats = {
                'completed': 0,
                'pending': 0,
                'failed': 0,
            }
        
        return jsonify({
            'success': True,
            'data': {
                'users': {
                    'total': total_users,
                    'new': new_users,
                    'growth': round((new_users / max(total_users - new_users, 1)) * 100, 2)
                },
                'orders': {
                    'total': total_orders,
                    'pending': pending_orders,
                    'processing': processing_orders,
                    'completed': completed_orders,
                    'trends': order_trends
                },
                'revenue': {
                    'total': float(total_revenue),
                    'monthly': float(monthly_revenue),
                    'growth': round(((monthly_revenue / max(total_revenue - monthly_revenue, 1)) * 100), 2) if total_revenue > 0 else 0
                },
                'payments': payment_stats
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching performance data: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

# ========================================
# USER MANAGEMENT ENDPOINTS
# ========================================

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users - Admin only"""
    try:
        admin_user = check_admin()
        if not admin_user:
            return jsonify({
                'success': False,
                'message': 'Access denied. Admin only.'
            }), 403
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search', '')
        role = request.args.get('role', 'all')
        status = request.args.get('status', 'all')  # all, active, inactive
        
        # Build query
        query = User.query
        
        # Filter by role
        if role and role != 'all':
            query = query.filter_by(role=role)
        
        # Filter by status
        if status == 'active':
            query = query.filter_by(isactive=True)
        elif status == 'inactive':
            query = query.filter_by(isactive=False)
        
        # Search
        if search:
            query = query.filter(
                or_(
                    User.name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%')
                )
            )
        
        # Order by createdat desc
        query = query.order_by(User.created_at.desc())
        
        # Pagination
        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        
        users_list = [user.to_dict() for user in pagination.items]
        
        return jsonify({
            'success': True,
            'data': {
                'users': users_list,
                'pagination': {
                    'currentPage': page,
                    'totalPages': pagination.pages,
                    'totalItems': pagination.total,
                    'itemsPerPage': limit
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get users: {str(e)}'
        }), 500

@admin_bp.route('/users/<user_id>', methods=['GET'])
@jwt_required()
def get_user_detail(user_id):
    """Get user detail - Admin only"""
    try:
        admin_user = check_admin()
        if not admin_user:
            return jsonify({
                'success': False,
                'message': 'Access denied. Admin only.'
            }), 403
        
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        user_data = user.to_dict()
        
        # Get user orders
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        orders_list = [order.to_dict() for order in orders]
        
        # Calculate statistics
        total_orders = len(orders)
        completed_orders = sum(1 for o in orders if o.status == 'completed')
        total_spent = sum(o.price for o in orders if o.payment_status == 'verified')
        total_kilograms = sum(o.weight for o in orders)
        
        user_data['statistics'] = {
            'totalOrders': total_orders,
            'completedOrders': completed_orders,
            'totalSpent': total_spent,
            'totalKilograms': total_kilograms,
            'averageOrderValue': total_spent / total_orders if total_orders > 0 else 0
        }
        
        return jsonify({
            'success': True,
            'data': {
                'user': user_data,
                'orders': orders_list
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get user: {str(e)}'
        }), 500

@admin_bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user - Admin only"""
    try:
        admin_user = check_admin()
        if not admin_user:
            return jsonify({
                'success': False,
                'message': 'Access denied. Admin only.'
            }), 403
        
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        data = request.get_json()
        
        # Update fields
        if 'isActive' in data:
            user.isactive = data['isActive']
        
        if 'role' in data:
            if data['role'] not in ['admin', 'user']:
                return jsonify({
                    'success': False,
                    'message': 'Invalid role. Must be admin or user.'
                }), 400
            user.role = data['role']
        
        if 'name' in data:
            user.name = data['name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'companyName' in data:
            user.companyname = data['companyName']
        if 'address' in data:
            user.address = data['address']
        
        user.updatedat = datetime.utcnow()
        
        def save_user():
            db.session.commit()
            return user
        
        execute_with_retry(save_user)
        
        return jsonify({
            'success': True,
            'message': 'User berhasil diperbarui',
            'data': user.to_dict()
        }), 200
        
    except (OperationalError, DisconnectionError) as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database connection error. Please try again.'
        }), 503
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to update user: {str(e)}'
        }), 500

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete user - Admin only"""
    try:
        admin_user = check_admin()
        if not admin_user:
            return jsonify({
                'success': False,
                'message': 'Access denied. Admin only.'
            }), 403
        
        if user_id == admin_user.id:
            return jsonify({
                'success': False,
                'message': 'Cannot delete your own account'
            }), 400
        
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        def delete_user():
            db.session.delete(user)
            db.session.commit()
        
        execute_with_retry(delete_user)
        
        return jsonify({
            'success': True,
            'message': 'User berhasil dihapus'
        }), 200
        
    except (OperationalError, DisconnectionError) as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database connection error. Please try again.'
        }), 503
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to delete user: {str(e)}'
        }), 500

@admin_bp.route('/orders/<order_id>/status', methods=['PUT'])
@jwt_required(optional=True)
def update_order_status(order_id):
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'success': False, 'message': 'Status is required'}), 400
        
        # Find order
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404
        
        # Update status
        order.status = new_status
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Status updated successfully',
            'data': {
                'id': order.id,
                'status': order.status
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating order status: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ✅ ASSIGN MACHINE TO ORDER
@admin_bp.route('/orders/<order_id>/assign-machine', methods=['PUT'])
@jwt_required(optional=True)
def assign_machine(order_id):
    try:
        data = request.get_json()
        machine_id = data.get('machineId')
        machine_name = data.get('machineName')
        
        if not machine_id or not machine_name:
            return jsonify({
                'success': False, 
                'message': 'machineId and machineName are required'
            }), 400
        
        # Find order
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404
        
        # Assign machine
        order.machine_id = machine_id
        order.machine_name = machine_name
        
        # Auto-update status to processing if pending
        if order.status == 'pending':
            order.status = 'processing'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Machine assigned successfully',
            'data': {
                'id': order.id,
                'machineId': order.machine_id,
                'machineName': order.machine_name,
                'status': order.status
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error assigning machine: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ✅ GET ALL ORDERS
@admin_bp.route('/orders', methods=['GET'])
@jwt_required()
def getorders():
    print("=" * 60)
    print("🔥 GET ORDERS ENDPOINT HIT!")
    print("=" * 60)
    
    try:
        orders = Order.query.all()
        print(f"📦 Found {len(orders)} orders")
        
        order_list = []
        for order in orders:
            # ✅ Debug: Check if order has payments relationship
            print(f"\nOrder {order.id}:")
            print(f"  - Has 'payments' attr? {hasattr(order, 'payments')}")
            
            payment_data = None
            
            # ✅ CRITICAL: Get payment data
            if hasattr(order, 'payments') and order.payments:
                print(f"  - Payments found: {len(order.payments)}")
                
                # Get the most recent payment
                latest_payment = sorted(order.payments, key=lambda p: p.created_at, reverse=True)[0]
                
                payment_data = {
                    'id': latest_payment.id,
                    'method': latest_payment.method,
                    'accountName': latest_payment.account_name,
                    'amount': float(latest_payment.amount),
                    'proofImage': latest_payment.proof_image,
                    'status': latest_payment.status,
                    'uploadedAt': latest_payment.uploaded_at.isoformat() if latest_payment.uploaded_at else None,
                    'verifiedAt': latest_payment.verified_at.isoformat() if latest_payment.verified_at else None,
                    'notes': latest_payment.notes,
                    'rejectionReason': latest_payment.rejection_reason
                }
                print(f"  - Payment data: {payment_data['id']}")
            else:
                print(f"  - No payments found")
            
            order_list.append({
                'id': order.id,
                'userId': order.user_id,
                'customerName': order.customer_name,
                'customerEmail': order.customer_email,
                'customerPhone': order.customer_phone,
                'customerAddress': order.customer_address,
                'coffeeType': order.coffee_type,
                'weight': order.weight,
                'price': order.price,
                'status': order.status,
                'paymentStatus': order.payment_status,
                'notes': order.notes,
                'machineId': order.machine_id,
                'machineName': order.machine_name,
                'createdAt': order.created_at.isoformat() if order.created_at else None,
                'deliveryDate': order.delivery_date.isoformat() if order.delivery_date else None,
                'payment': payment_data  # ✅ Include payment data
            })
        
        print(f"\n✅ Returning {len(order_list)} orders")
        return jsonify({
            'success': True,
            'data': order_list
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching orders: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

    
@admin_bp.route('/orders/<order_id>/payment-status', methods=['PUT', 'OPTIONS'])
@jwt_required(optional=True)
def update_payment_status(order_id):
    """Update payment status for an order"""
    
    # Handle preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        # Validate status
        if not new_status:
            return jsonify({
                'success': False,
                'message': 'Status is required'
            }), 400
        
        if new_status not in ['pending', 'verified', 'rejected']:
            return jsonify({
                'success': False,
                'message': 'Invalid payment status. Must be: pending, verified, or rejected'
            }), 400
        
        # Find order
        order = Order.query.get(order_id)
        if not order:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        # Update payment status
        order.payment_status = new_status
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Payment status updated to {new_status}',
            'data': {
                'id': order.id,
                'paymentStatus': order.payment_status
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating payment status: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500