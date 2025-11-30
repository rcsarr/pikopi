from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.machine import Machine
from app.models.machine_log import MachineLog
from app.models.sorting_result import SortingResult
from app.models.sorting_batch import SortingBatch
from app.models.order import Order
from sqlalchemy import func
from datetime import datetime, timedelta

machine_routes_bp = Blueprint('machine_routes', __name__)

@machine_routes_bp.route('/machines', methods=['GET'])
@jwt_required()
def get_machines():
    try:
        machines = Machine.query.order_by(Machine.id.asc()).all()
        
        results = []
        for machine in machines:
            # Get latest machine data
            from app.models.machine_data import MachineData
            
            latest_data = MachineData.query.filter_by(machine_id=machine.id)\
                .order_by(MachineData.created_at.desc())\
                .first()
            
            # Default values if no data exists
            processed_today = 0
            remaining_batches = 0
            efficiency = 0.0
            error_rate = 0.0
            temperature = machine.temperature # Fallback to machine table
            
            if latest_data:
                processed_today = latest_data.processed_today
                remaining_batches = latest_data.remaining_batch
                efficiency = latest_data.efficiency
                error_rate = latest_data.error_rate
                temperature = latest_data.temperature
                
            # Get latest logs from machine_logs table
            logs = MachineLog.query.filter_by(machine_id=machine.id)\
                .order_by(MachineLog.created_at.desc())\
                .limit(10).all()
            
            # Calculate real pending batches from SortingBatch
            # Use machine_id from the order, not from the batch itself
            real_pending_batches = SortingBatch.query.join(Order).filter(
                Order.machine_id == machine.id,
                SortingBatch.status == 'pending'
            ).count()
            
            machine_data = machine.to_dict()
            
            # Override status.temperature with data from machines_data
            machine_data['status']['temperature'] = temperature
            
            machine_data['statistics'] = {
                'processedToday': int(processed_today),
                'currentBatch': real_pending_batches, # Use real pending count
                'efficiency': round(efficiency, 1),
                'errorRate': round(error_rate, 1)
            }
            machine_data['logs'] = [log.to_dict() for log in logs]
            
            results.append(machine_data)
            
        return jsonify({
            'success': True,
            'data': results
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@machine_routes_bp.route('/machines', methods=['POST'])
@jwt_required()
def create_machine():
    try:
        data = request.get_json()
        name = data.get('name')
        location = data.get('location')
        
        if not name:
            return jsonify({'success': False, 'message': 'Name is required'}), 400
            
        # Generate ID (simple auto-increment-like or UUID based on existing count)
        # For simplicity and readability, let's use M-XXX format
        count = Machine.query.count()
        new_id = f"M-{str(count + 1).zfill(3)}"
        
        # Ensure uniqueness (simple check)
        while Machine.query.get(new_id):
            count += 1
            new_id = f"M-{str(count + 1).zfill(3)}"
            
        new_machine = Machine(
            id=new_id,
            name=name,
            location=location,
            status_power=False,
            temperature=0.0
        )
        
        db.session.add(new_machine)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Machine created successfully',
            'data': new_machine.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@machine_routes_bp.route('/machines/<machine_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_machine(machine_id):
    try:
        machine = Machine.query.get(machine_id)
        if not machine:
            return jsonify({'success': False, 'message': 'Machine not found'}), 404
            
        data = request.get_json()
        target = data.get('target') # 'power'
        
        if target == 'power':
            machine.status_power = not machine.status_power
            log_msg = f"{machine.name} {'aktif' if machine.status_power else 'mati'}"
            log_type = 'success' if machine.status_power else 'info'
            
            # Create log in machine_logs table with custom ID
            new_log = MachineLog(
                id=MachineLog.generate_id(),
                machine_id=machine.id,
                message=log_msg,
                type=log_type
            )
            db.session.add(new_log)
            
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': machine.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@machine_routes_bp.route('/machines/<machine_id>/logs', methods=['POST'])
@jwt_required()
def create_machine_log(machine_id):
    """Create a new log entry in machine_logs table"""
    try:
        machine = Machine.query.get(machine_id)
        if not machine:
            return jsonify({'success': False, 'message': 'Machine not found'}), 404
            
        data = request.get_json()
        message = data.get('message')
        log_type = data.get('type', 'info')  # 'success', 'info', 'warning', 'error'
        
        if not message:
            return jsonify({'success': False, 'message': 'Message is required'}), 400
        
        # Create log in machine_logs table with custom ID
        new_log = MachineLog(
            id=MachineLog.generate_id(),
            machine_id=machine.id,
            message=message,
            type=log_type
        )
        db.session.add(new_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Log created successfully',
            'data': new_log.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
