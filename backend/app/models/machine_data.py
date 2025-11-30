from app import db
from datetime import datetime
import uuid

class MachineData(db.Model):
    __tablename__ = 'machines_data'

    id = db.Column(db.String(50), primary_key=True)
    machine_id = db.Column(db.String(50), db.ForeignKey('machines.id'), nullable=False)
    temperature = db.Column(db.Float, default=0.0)
    processed_today = db.Column(db.Integer, default=0)
    remaining_batch = db.Column(db.Integer, default=0)
    efficiency = db.Column(db.Float, default=0.0)
    error_rate = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def generate_id():
        try:
            last = MachineData.query.order_by(MachineData.id.desc()).first()
            if not last:
                return "MD_001"
            
            # Extract number part (assuming format MD_XXX)
            parts = last.id.split('_')
            if len(parts) > 1 and parts[1].isdigit():
                num = int(parts[1])
                return f"MD_{str(num + 1).zfill(3)}"
            
            # Fallback if format is different
            return f"MD_{uuid.uuid4().hex[:3].upper()}"
        except Exception:
            return f"MD_{uuid.uuid4().hex[:3].upper()}"

    def to_dict(self):
        return {
            'id': self.id,
            'machine_id': self.machine_id,
            'temperature': self.temperature,
            'processed_today': self.processed_today,
            'remaining_batch': self.remaining_batch,
            'efficiency': self.efficiency,
            'error_rate': self.error_rate,
            'created_at': self.created_at.isoformat()
        }
