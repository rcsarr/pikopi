from app import db
from datetime import datetime
import pytz

JAKARTA_TZ = pytz.timezone('Asia/Jakarta')

def jakarta_now():
    return datetime.now(JAKARTA_TZ).replace(tzinfo=None)

class SortingBatch(db.Model):
    __tablename__ = 'sorting_batches'

    id = db.Column(db.String(50), primary_key=True)
    order_id = db.Column(db.String(50), db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    machine_id = db.Column(db.String(50), db.ForeignKey('machines.id'), nullable=True)
    batch_number = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='completed')
    
    # Weight Details (Max 20kg constraint handled in app logic)
    total_weight = db.Column(db.Float, nullable=False)
    
    # Sorting Results
    total_beans = db.Column(db.Integer, nullable=False)
    healthy_beans = db.Column(db.Integer, nullable=False)
    defective_beans = db.Column(db.Integer, nullable=False)
    accuracy = db.Column(db.Float, nullable=False)
    
    # Images
    image_url = db.Column(db.Text)
    sample_healthy_1_url = db.Column(db.Text)
    sample_healthy_2_url = db.Column(db.Text)
    sample_defective_1_url = db.Column(db.Text)
    sample_defective_2_url = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=jakarta_now)

    # Relationships
    order = db.relationship('Order', backref=db.backref('batches', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'orderId': self.order_id,
            'batchNumber': self.batch_number,
            'status': self.status,
            'totalWeight': self.total_weight,
            'totalBeans': self.total_beans,
            'healthyBeans': self.healthy_beans,
            'defectiveBeans': self.defective_beans,
            'accuracy': self.accuracy,
            'imageUrl': self.image_url,
            'sampleHealthy1Url': self.sample_healthy_1_url,
            'sampleHealthy2Url': self.sample_healthy_2_url,
            'sampleDefective1Url': self.sample_defective_1_url,
            'sampleDefective2Url': self.sample_defective_2_url,
            'createdAt': JAKARTA_TZ.localize(self.created_at).isoformat() if self.created_at else None
        }
