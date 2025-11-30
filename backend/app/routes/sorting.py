from flask import Blueprint, request, jsonify
from app import db
from app.models.sorting_result import SortingResult
from app.models.order import Order
from app.models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import func

sorting_bp = Blueprint('sorting', __name__)

@sorting_bp.route('/sorting/results', methods=['POST'])
@jwt_required()
def create_sorting_result():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['orderId', 'totalBeans', 'healthyBeans', 'defectiveBeans', 'totalWeight']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Field {field} is required'}), 400
        
        # ✅ Calculate percentages (SELALU BENAR)
        total = data['totalBeans']
        healthy = data['healthyBeans']
        defective = data['defectiveBeans']
        
        healthy_pct = (healthy / total * 100) if total > 0 else 0
        defective_pct = (defective / total * 100) if total > 0 else 0
        
        total_weight = data['totalWeight']
        healthy_weight = (healthy / total * total_weight) if total > 0 else 0
        defective_weight = (defective / total * total_weight) if total > 0 else 0
        
        # Create sorting result dengan persentase yang benar
        result = SortingResult(
            order_id=data['orderId'],
            user_id=current_user_id,
            total_beans=total,
            healthy_beans=healthy,
            defective_beans=defective,
            healthy_percentage=healthy_pct,      # ✅ Set dari calculated value
            defective_percentage=defective_pct,  # ✅ Set dari calculated value
            total_weight=total_weight,
            healthy_weight=healthy_weight,
            defective_weight=defective_weight,
            accuracy=data.get('accuracy', 95.0)
        )
        
        db.session.add(result)
        db.session.flush()  # Get the ID before committing
        
        # ✅ Add entry to history table for chart
        from app.models.sorting_result_history import SortingResultHistory
        history_entry = SortingResultHistory(
            order_id=data['orderId'],
            accuracy=data.get('accuracy', 95.0),
            created_at=datetime.utcnow()
        )
        db.session.add(history_entry)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Sorting result saved successfully',
            'data': result.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to save sorting result: {str(e)}'}), 500


@sorting_bp.route('/sorting/results', methods=['GET'])
@jwt_required()
def get_sorting_results():
    """Get all sorting results for current user"""
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
            results = SortingResult.query.order_by(SortingResult.sorted_at.desc()).all()
        else:
            results = SortingResult.query.filter_by(user_id=current_user_id)\
                .order_by(SortingResult.sorted_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [result.to_dict() for result in results]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch sorting results: {str(e)}'
        }), 500

@sorting_bp.route('/sorting/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        current_user_id = get_jwt_identity()
        print(f"🔍 Current user ID: {current_user_id}")
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Get query parameters
        period = request.args.get('period', 'all')
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)

        if not year:
            year = datetime.now().year
        if period == 'month' and not month:
            month = datetime.now().month

        # Base query for sorting results
        query = SortingResult.query
        if user.role != 'admin':
            query = query.filter_by(user_id=current_user_id)

        # Apply date filters
        if period == 'month':
            query = query.filter(
                func.extract('year', SortingResult.sorted_at) == year,
                func.extract('month', SortingResult.sorted_at) == month
            )
        elif period == 'year':
            query = query.filter(
                func.extract('year', SortingResult.sorted_at) == year
            )
        
        results = query.all()
        
        print(f"📊 Found {len(results)} sorting results for period: {period}")

        # Calculate aggregated stats
        total_beans = sum(r.total_beans for r in results)
        healthy_beans = sum(r.healthy_beans for r in results)
        defective_beans = sum(r.defective_beans for r in results)
        
        healthy_pct = (healthy_beans / total_beans * 100) if total_beans > 0 else 0
        defective_pct = (defective_beans / total_beans * 100) if total_beans > 0 else 0
        
        # Get average accuracy
        accuracy_query = db.session.query(func.avg(SortingResult.accuracy))
        if user.role != 'admin':
            accuracy_query = accuracy_query.filter_by(user_id=current_user_id)
            
        if period == 'month':
            accuracy_query = accuracy_query.filter(
                func.extract('year', SortingResult.sorted_at) == year,
                func.extract('month', SortingResult.sorted_at) == month
            )
        elif period == 'year':
            accuracy_query = accuracy_query.filter(
                func.extract('year', SortingResult.sorted_at) == year
            )
            
        avg_accuracy = accuracy_query.scalar() or 95.0
        
        # Get order statistics
        order_query = Order.query
        if user.role != 'admin':
            order_query = order_query.filter_by(user_id=current_user_id)
            
        if period == 'month':
            order_query = order_query.filter(
                func.extract('year', Order.created_at) == year,
                func.extract('month', Order.created_at) == month
            )
        elif period == 'year':
            order_query = order_query.filter(
                func.extract('year', Order.created_at) == year
            )
            
        orders = order_query.all()
        
        order_stats = [
            {
                'orderId': order.id,
                'weight': order.weight,
                'totalCost': order.price
            }
            for order in orders
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'totalBeans': total_beans,
                'healthyBeans': healthy_beans,
                'defectiveBeans': defective_beans,
                'healthyPercentage': round(healthy_pct, 1),
                'defectivePercentage': round(defective_pct, 1),
                'accuracy': round(avg_accuracy, 1),
                'totalOrders': len(orders),
                'totalCost': sum(o.price for o in orders),
                'orderStats': order_stats
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch dashboard stats: {str(e)}'
        }), 500
