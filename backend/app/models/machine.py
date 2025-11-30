from app import db
from datetime import datetime

class Machine(db.Model):
    __tablename__ = 'machines'

    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200))
    status_power = db.Column(db.Boolean, default=False)
    temperature = db.Column(db.Float, default=0.0)
    last_maintenance = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'status': {
                'power': self.status_power,
                'temperature': self.temperature,
            },
            'lastMaintenance': self.last_maintenance.isoformat() if self.last_maintenance else None
        }
