from app import db
from datetime import datetime

class SortingResultHistory(db.Model):
    __tablename__ = 'sorting_results_history'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(50), db.ForeignKey('orders.id'), nullable=False)
    accuracy = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    order = db.relationship('Order', backref=db.backref('history', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'orderId': self.order_id,
            'accuracy': self.accuracy,
            'timestamp': self.created_at.isoformat() if self.created_at else None
        }
