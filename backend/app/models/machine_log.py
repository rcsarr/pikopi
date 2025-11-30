from app import db
from datetime import datetime
import pytz

JAKARTA_TZ = pytz.timezone('Asia/Jakarta')

def jakarta_now():
    return datetime.now(JAKARTA_TZ).replace(tzinfo=None)

class MachineLog(db.Model):
    __tablename__ = 'machine_logs'

    id = db.Column(db.String(50), primary_key=True)
    machine_id = db.Column(db.String(50), db.ForeignKey('machines.id'))
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False) # 'success', 'info', 'warning', 'error'
    created_at = db.Column(db.DateTime, default=jakarta_now)

    @staticmethod
    def generate_id():
        """Generate next M_LOG-### ID"""
        last_log = MachineLog.query.order_by(MachineLog.created_at.desc()).first()
        if not last_log or not last_log.id.startswith('M_LOG-'):
            return 'M_LOG-001'
        
        try:
            last_num = int(last_log.id.split('-')[1])
            next_num = last_num + 1
            return f'M_LOG-{next_num:03d}'
        except (IndexError, ValueError):
            return 'M_LOG-001'

    def to_dict(self):
        return {
            'id': self.id,
            'machineId': self.machine_id,
            'message': self.message,
            'type': self.type,
            'time': JAKARTA_TZ.localize(self.created_at).isoformat() if self.created_at else None
        }
