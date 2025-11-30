from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.order import Order
from app.models.performance import PerformanceLog
from datetime import datetime, timedelta
import random
import uuid
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import OperationalError, DisconnectionError
import time

statistics_bp = Blueprint('statistics', __name__)

def execute_with_retry(func, max_retries=3):
    """Execute database operation with retry logic"""
    for attempt in range(max_retries):
        try:
            return func()
        except (OperationalError, DisconnectionError) as e:
            if attempt < max_retries - 1:
                error_msg = str(e).lower()
                if "server closed the connection" in error_msg or "connection" in error_msg:
                    wait_time = (attempt + 1) * 0.5
                    time.sleep(wait_time)
                    db.session.rollback()
                    continue
            raise
        except Exception:
            raise

@statistics_bp.route('/users/me/statistics', methods=['GET'])
@jwt_required()
def get_user_statistics():
    """Get current user statistics"""
    try:
        user_id = get_jwt_identity()
        
        # Get user
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404

        # TODO: When Order model is implemented, calculate from orders
        # For now, return mock data structure
        statistics = {
            'totalOrders': 0,
            'completedOrders': 0,
            'processingOrders': 0,
            'pendingOrders': 0,
            'totalSpent': 0,
            'totalKilograms': 0,
            'averageAccuracy': 0,
            'coffeeTypeDistribution': {}
        }

        return jsonify({
            'success': True,
            'data': statistics
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get statistics: {str(e)}'
        }), 500

@statistics_bp.route('/admin/statistics', methods=['GET'])
@jwt_required()
def get_admin_statistics():
    """Get admin dashboard statistics"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Access denied. Admin only.'
            }), 403

        period = request.args.get('period', 'month')  # day, week, month, year

        # Calculate date range
        now = datetime.utcnow()
        if period == 'day':
            start_date = now - timedelta(days=1)
        elif period == 'week':
            start_date = now - timedelta(weeks=1)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        elif period == 'year':
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=30)

        # Get user statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        admin_users = User.query.filter_by(role='admin').count()
        regular_users = User.query.filter_by(role='user').count()

        # Get order statistics based on period
        order_query = Order.query
        if start_date:
            order_query = order_query.filter(Order.created_at >= start_date)
            
        orders = order_query.all()
        
        total_orders = len(orders)
        pending_orders = sum(1 for o in orders if o.status == 'pending')
        processing_orders = sum(1 for o in orders if o.status == 'processing')
        completed_orders = sum(1 for o in orders if o.status == 'completed')
        cancelled_orders = sum(1 for o in orders if o.status == 'cancelled')
        
        # Calculate revenue (sum of price for completed orders)
        # Note: In a real app, you might want to check payment_status too
        total_revenue = sum(o.price for o in orders if o.status == 'completed' or o.payment_status == 'verified')
        total_kilograms = sum(o.weight for o in orders)

        # Calculate revenue chart data (group by day)
        revenue_chart = {}
        for order in orders:
            if order.status == 'completed' or order.payment_status == 'verified':
                day_key = order.created_at.strftime('%Y-%m-%d')
                if day_key not in revenue_chart:
                    revenue_chart[day_key] = 0
                revenue_chart[day_key] += order.price
                
        # Format revenue chart for frontend
        revenue_chart_data = [
            {'date': date, 'revenue': amount} 
            for date, amount in sorted(revenue_chart.items())
        ]

        statistics = {
            'overview': {
                'totalUsers': total_users,
                'activeUsers': active_users,
                'inactiveUsers': total_users - active_users,
                'adminUsers': admin_users,
                'regularUsers': regular_users,
                'totalOrders': total_orders,
                'pendingOrders': pending_orders,
                'processingOrders': processing_orders,
                'completedOrders': completed_orders,
                'cancelledOrders': cancelled_orders,
                'totalRevenue': total_revenue,
                'totalKilograms': total_kilograms
            },
            'machineUtilization': [], # Placeholder for now
            'revenueChart': revenue_chart_data,
            'orderStatusChart': {
                'pending': pending_orders,
                'processing': processing_orders,
                'completed': completed_orders,
                'cancelled': cancelled_orders
            },
            'coffeeTypeChart': {}, # Placeholder
            'userGrowthChart': [] # Placeholder
        }

        return jsonify({
            'success': True,
            'data': statistics
        }), 200


    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get statistics: {str(e)}'
        }), 500

@statistics_bp.route('/admin/performance', methods=['GET'])
@jwt_required()
def get_performance_data():
    """Get performance data for admin dashboard"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Access denied. Admin only.'
            }), 403

        # Get data for the last 24 hours by default
        since = request.args.get('since')
        
        # Use SortingResultHistory instead of PerformanceLog
        from app.models.sorting_result_history import SortingResultHistory
        query = SortingResultHistory.query
        
        if since:
            try:
                since_date = datetime.fromisoformat(since.replace('Z', '+00:00'))
                query = query.filter(SortingResultHistory.created_at >= since_date)
            except ValueError:
                pass  # Ignore invalid date
        else:
            # Default to last 30 days
            start_date = datetime.utcnow() - timedelta(days=30)
            query = query.filter(SortingResultHistory.created_at >= start_date)
            
        logs = query.order_by(SortingResultHistory.created_at.asc()).all()
        
        return jsonify({
            'success': True, 
            'data': [log.to_dict() for log in logs]
        }), 200
    except Exception as e:
        print(f"Error fetching performance data: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@statistics_bp.route('/admin/performance/generate', methods=['POST'])
@jwt_required()
def generate_performance_data():
    """Generate dummy performance data for testing"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        def find_user():
            return User.query.get(user_id)
        
        user = execute_with_retry(find_user)
        
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Access denied. Admin only.'
            }), 403

        # Generate dummy data for the last 24 hours at 15 min intervals
        # Only if no data exists to avoid duplicates
        if PerformanceLog.query.count() > 0:
             return jsonify({'success': True, 'message': 'Data already exists'}), 200

        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=24)
        
        current_time = start_time
        new_logs = []
        
        while current_time <= end_time:
            # Random accuracy between 85% and 99%
            accuracy = 85 + (random.random() * 14)
            
            log = PerformanceLog(
                id=str(uuid.uuid4()),
                timestamp=current_time,
                accuracy=round(accuracy, 2),
                machine_id="MACHINE-01"
            )
            db.session.add(log)
            new_logs.append(log)
            
            current_time += timedelta(minutes=15)
            
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'count': len(new_logs),
            'message': 'Generated performance data'
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error generating performance data: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
