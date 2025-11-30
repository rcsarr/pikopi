from app import db
from datetime import datetime

class SortingResult(db.Model):
    __tablename__ = 'sorting_results'
    
    id = db.Column(db.String(50), primary_key=True)
    order_id = db.Column(db.String(50), db.ForeignKey('orders.id', ondelete='CASCADE'), db.ForeignKey('orders.id'), nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    # machine_id removed as it is in orders table
    
    # Total beans
    total_beans = db.Column(db.Integer, nullable=False)
    healthy_beans = db.Column(db.Integer, nullable=False)
    defective_beans = db.Column(db.Integer, nullable=False)
    
    # Percentages
    healthy_percentage = db.Column(db.Float, nullable=False)
    defective_percentage = db.Column(db.Float, nullable=False)
    
    # Weight (in kg)
    total_weight = db.Column(db.Float, nullable=False)
    healthy_weight = db.Column(db.Float, nullable=False)
    defective_weight = db.Column(db.Float, nullable=False)
    
    # System accuracy
    accuracy = db.Column(db.Float, nullable=True)
    
    # Timestamps
    sorted_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('sorting_results', lazy=True))
    
    def __init__(self, **kwargs):
        if 'id' not in kwargs:
            kwargs['id'] = f"SORT{int(datetime.utcnow().timestamp() * 1000)}"
        super(SortingResult, self).__init__(**kwargs)
    
    def to_dict(self):
        return {
            'id': self.id,
            'orderId': self.order_id,
            'userId': self.user_id,
            'machineId': self.order.machine_id if self.order else None,  # ✅ Fetch from Order
            'totalBeans': self.total_beans,
            'healthyBeans': self.healthy_beans,
            'defectiveBeans': self.defective_beans,
            'healthyPercentage': self.healthy_percentage,
            'defectivePercentage': self.defective_percentage,
            'totalWeight': self.total_weight,
            'healthyWeight': self.healthy_weight,
            'defectiveWeight': self.defective_weight,
            'accuracy': self.accuracy,
            'sortedAt': self.sorted_at.isoformat() if self.sorted_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }
