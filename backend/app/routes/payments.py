# app/routes/payments.py
from flask import Blueprint, request, jsonify
from app import db
from app.models.payment import Payment, PaymentMethod
from app.models.order import Order
from app.models.user import User
from app.models.notification import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid

payments_bp = Blueprint('payments', __name__)

def generate_payment_id():
    """Generate unique payment ID"""
    try:
        last_payment = Payment.query.order_by(Payment.id.desc()).first()
        if last_payment and last_payment.id:
            try:
                last_num = int(last_payment.id.split('-')[1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1
        
        while True:
            new_id = f'PAY-{str(next_num).zfill(3)}'
            if not Payment.query.get(new_id):
                return new_id
            next_num += 1
    except Exception:
        return f'PAY-{str(1).zfill(3)}'


@payments_bp.route('/payments/methods', methods=['GET'])
def get_payment_methods():
    """Get all active payment methods"""
    try:
        methods = PaymentMethod.query.filter_by(is_active=True)\
            .order_by(PaymentMethod.display_order).all()
        
        # Group by category
        grouped = {}
        for method in methods:
            if method.category not in grouped:
                grouped[method.category] = []
            grouped[method.category].append({
                'name': method.name,
                'accountNumber': method.account_number,
                'accountHolder': method.account_holder
            })
        
        return jsonify({
            'success': True,
            'data': grouped
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch payment methods: {str(e)}'
        }), 500


@payments_bp.route('/payments', methods=['POST'])
@jwt_required()
def create_payment():
    """Upload payment proof"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validasi
        required_fields = ['orderId', 'method', 'accountName', 'amount', 'proofImage']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Field {field} is required'
                }), 400
        
        # Cek order exists dan milik user
        order = Order.query.get(data['orderId'])
        if not order:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        if order.user_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Cek apakah sudah ada payment untuk order ini
        existing_payment = Payment.query.filter_by(order_id=data['orderId']).first()
        if existing_payment:
            # Jika payment sebelumnya ditolak, boleh upload ulang
            if existing_payment.status != 'rejected':
                return jsonify({
                    'success': False,
                    'message': 'Payment already exists for this order'
                }), 400
            # Delete payment yang ditolak
            db.session.delete(existing_payment)
        
        # Buat payment baru
        payment = Payment(
            id=generate_payment_id(),
            order_id=data['orderId'],
            user_id=current_user_id,
            method=data['method'],
            account_name=data['accountName'],
            amount=data['amount'],
            proof_image=data['proofImage'],
            notes=data.get('notes'),
            status='pending'
        )
        
        # Update order payment status
        order.payment_status = 'pending'
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Payment uploaded successfully',
            'data': payment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to upload payment: {str(e)}'
        }), 500


@payments_bp.route('/payments', methods=['GET'])
@jwt_required()
def get_payments():
    """Get all payments"""
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
            payments = Payment.query.order_by(Payment.uploaded_at.desc()).all()
        else:
            payments = Payment.query.filter_by(user_id=current_user_id)\
                .order_by(Payment.uploaded_at.desc()).all()
        
        # Include order data
        result = []
        for payment in payments:
            payment_dict = payment.to_dict()
            if payment.order:
                payment_dict['order'] = payment.order.to_dict()
            result.append(payment_dict)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch payments: {str(e)}'
        }), 500


@payments_bp.route('/payments/order/<order_id>', methods=['GET'])
@jwt_required()
def get_payment_by_order(order_id):
    """Get payment by order ID"""
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
        
        payment = Payment.query.filter_by(order_id=order_id).first()
        
        if not payment:
            return jsonify({
                'success': False,
                'message': 'Payment not found'
            }), 404
        
        payment_dict = payment.to_dict()
        payment_dict['order'] = order.to_dict()
        
        return jsonify({
            'success': True,
            'data': payment_dict
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch payment: {str(e)}'
        }), 500


@payments_bp.route('/payments/<payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    """Get single payment by ID"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({
                'success': False,
                'message': 'Payment not found'
            }), 404
        
        # Validasi akses
        if user.role != 'admin' and payment.user_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        payment_dict = payment.to_dict()
        if payment.order:
            payment_dict['order'] = payment.order.to_dict()
        
        return jsonify({
            'success': True,
            'data': payment_dict
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch payment: {str(e)}'
        }), 500


@payments_bp.route('/payments/<payment_id>/verify', methods=['POST'])
@jwt_required()
def verify_payment(payment_id):
    try:
        # Get payment
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({'success': False, 'message': 'Payment not found'}), 404
        
        # Update payment status
        payment.status = 'verified'
        payment.verified_at = datetime.utcnow()
        payment.verified_by = get_jwt_identity()
        
        # Create notification
        notif_id = f"NOTIF-{uuid.uuid4().hex[:12].upper()}"
        
        notification = Notification(
            id=notif_id,
            user_id=payment.user_id,
            type='payment_verified',
            title='Pembayaran Diverifikasi',
            message=f'Pembayaran untuk order {payment.order_id} telah diverifikasi',
            data={
                'payment_id': payment.id,
                'order_id': payment.order_id,
                'amount': float(payment.amount)
            },
            is_read=False
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Payment verified successfully',
            'data': {
                'payment': payment.to_dict(),
                'notification': {
                    'id': notification.id,
                    'title': notification.title,
                    'message': notification.message
                }
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error verifying payment: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@payments_bp.route('/payments/<payment_id>/reject', methods=['POST'])
@jwt_required()
def reject_payment(payment_id):
    """Reject payment (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        
        data = request.get_json()
        
        if 'reason' not in data or not data['reason'].strip():
            return jsonify({
                'success': False,
                'message': 'Rejection reason is required'
            }), 400
        
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({
                'success': False,
                'message': 'Payment not found'
            }), 404
        
        # Update payment status
        payment.status = 'rejected'
        payment.verified_at = datetime.utcnow()
        payment.verified_by = current_user_id
        payment.rejection_reason = data['reason']
        
        # Update order status
        order = Order.query.get(payment.order_id)
        if order:
            order.payment_status = 'rejected'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Payment rejected successfully',
            'data': payment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to reject payment: {str(e)}'
        }), 500
