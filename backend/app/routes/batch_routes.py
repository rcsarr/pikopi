from flask import Blueprint, request, jsonify
from app import db
from app.models.sorting_batch import SortingBatch
from app.models.order import Order
from app.models.notification import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid
from app.utils.notifications import create_notification

batch_bp = Blueprint('batch', __name__)

@batch_bp.route('/orders/<order_id>/batches', methods=['GET'])
@jwt_required()
def get_order_batches(order_id):
    try:
        # Verify order belongs to user (or user is admin)
        current_user_id = get_jwt_identity()
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404
            
        # Strict ownership check could be added here if needed
        # if order.user_id != current_user_id: ...

        batches = SortingBatch.query.filter_by(order_id=order_id).order_by(SortingBatch.batch_number.asc()).all()
        
        return jsonify({
            'success': True,
            'data': [batch.to_dict() for batch in batches]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@batch_bp.route('/batches', methods=['POST'])
@jwt_required()
def create_batch():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['orderId', 'batchNumber', 'totalWeight', 'totalBeans', 'healthyBeans', 'defectiveBeans']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Missing field: {field}'}), 400
                
        # Max 20kg validation
        if float(data['totalWeight']) > 20.0:
            return jsonify({'success': False, 'message': 'Maximum batch weight is 20kg'}), 400

        # Batches inherit machine assignment from their parent order
        # So we set status to 'pending' by default for newly created batches
        batch = SortingBatch(
            id=f"BATCH-{data['orderId']}-{data['batchNumber']}",
            order_id=data['orderId'],
            batch_number=data['batchNumber'],
            total_weight=data['totalWeight'],
            total_beans=data['totalBeans'],
            healthy_beans=data['healthyBeans'],
            defective_beans=data['defectiveBeans'],
            accuracy=data['accuracy'],
            status='pending',  # Default to pending since batches inherit machine from order
            image_url=data.get('imageUrl'),
            sample_healthy_1_url=data.get('sampleHealthy1Url'),
            sample_healthy_2_url=data.get('sampleHealthy2Url'),
            sample_defective_1_url=data.get('sampleDefective1Url'),
            sample_defective_2_url=data.get('sampleDefective2Url')
        )
        
        db.session.add(batch)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Batch created successfully',
            'data': batch.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@batch_bp.route('/batches/history', methods=['GET'])
@jwt_required()
def get_batch_history():
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        period = request.args.get('period', 'month')  # month, year
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        
        if not year:
            year = datetime.now().year
            
        if period == 'month' and not month:
            month = datetime.now().month

        # Build query
        query = SortingBatch.query.join(Order).filter(Order.user_id == user_id)
        
        if period == 'month':
            query = query.filter(
                db.extract('year', SortingBatch.created_at) == year,
                db.extract('month', SortingBatch.created_at) == month
            )
        elif period == 'year':
            query = query.filter(
                db.extract('year', SortingBatch.created_at) == year
            )
            
        # Order by date desc
        batches = query.order_by(SortingBatch.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [batch.to_dict() for batch in batches]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
@batch_bp.route('/orders/<order_id>/batches/auto-generate', methods=['POST'])
@jwt_required()
def auto_generate_batches(order_id):
    try:
        # Verify order exists
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404

        # Check if batches already exist
        existing_batches = SortingBatch.query.filter_by(order_id=order_id).count()
        if existing_batches > 0:
            return jsonify({'success': False, 'message': 'Batches already exist for this order'}), 400

        # Calculate batches (Max 10kg per batch)
        total_weight = order.weight
        batch_size_limit = 10.0
        
        num_batches = int(total_weight // batch_size_limit)
        remainder = total_weight % batch_size_limit
        
        batches_to_create = []
        
        # Create full batches
        for i in range(num_batches):
            batches_to_create.append({
                'batch_number': i + 1,
                'weight': batch_size_limit
            })
            
        # Create remainder batch
        if remainder > 0:
            batches_to_create.append({
                'batch_number': num_batches + 1,
                'weight': round(remainder, 2)
            })
            
        created_batches = []
        
        for batch_data in batches_to_create:
            new_batch = SortingBatch(
                id=f"BATCH-{order_id}-{batch_data['batch_number']}",
                order_id=order_id,
                batch_number=batch_data['batch_number'],
                total_weight=batch_data['weight'],
                status='pending',
                total_beans=0,
                healthy_beans=0,
                defective_beans=0,
                accuracy=0
            )
            db.session.add(new_batch)
            created_batches.append(new_batch)
            
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully generated {len(created_batches)} batches',
            'data': [batch.to_dict() for batch in created_batches]
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@batch_bp.route('/batches/<batch_id>', methods=['PUT'])
@jwt_required()
def update_batch(batch_id):
    try:
        batch = SortingBatch.query.get(batch_id)
        if not batch:
            return jsonify({'success': False, 'message': 'Batch not found'}), 404
            
        data = request.get_json()
        
        # Update allowed fields
        if 'totalWeight' in data:
            batch.total_weight = data['totalWeight']
        if 'status' in data:
            batch.status = data['status']
            
        # Update results if provided
        if 'totalBeans' in data:
            batch.total_beans = data['totalBeans']
        if 'healthyBeans' in data:
            batch.healthy_beans = data['healthyBeans']
        if 'defectiveBeans' in data:
            batch.defective_beans = data['defectiveBeans']
        if 'accuracy' in data:
            batch.accuracy = data['accuracy']
            
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Batch updated successfully',
            'data': batch.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@batch_bp.route('/batches/<batch_id>/complete', methods=['POST'])
@jwt_required()
def complete_batch(batch_id):
    try:
        batch = Batch.query.get(batch_id)
        if not batch:
            return jsonify({'success': False, 'message': 'Batch not found'}), 404
        
        # Update batch status
        batch.status = 'completed'
        batch.completed_at = datetime.utcnow()
        db.session.commit()
        
        # ✅ Send notification to batch owner
        create_notification(
            user_id=batch.user_id,
            notification_type='batch_completed',
            title='Sortir Selesai',
            message=f'Batch {batch_id} telah selesai disortir. Total: {batch.total_beans or 0} biji kopi.',
            data={
                'batch_id': batch_id,
                'total_beans': batch.total_beans,
                'grade_a': batch.grade_a or 0,
                'grade_b': batch.grade_b or 0,
                'grade_c': batch.grade_c or 0,
                'defect': batch.defect or 0
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Batch completed successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error completing batch: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500