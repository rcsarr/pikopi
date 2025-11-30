from app import db
from datetime import datetime
import uuid

class PerformanceLog(db.Model):
    __tablename__ = 'performance_logs'

    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    accuracy = db.Column(db.Float, nullable=False)
    machine_id = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'accuracy': self.accuracy,
            'machineId': self.machine_id
        }
