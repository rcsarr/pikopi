# app/models/payment.py
from app import db
from datetime import datetime

class Payment(db.Model):
    __tablename__ = 'payments'
    __table_args__ = {'extend_existing': True}  # ✅ ADD THIS LINE
    
    id = db.Column(db.String(50), primary_key=True)
    order_id = db.Column(db.String(50), db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Detail Pembayaran
    method = db.Column(db.String(100), nullable=False)
    account_name = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    proof_image = db.Column(db.Text, nullable=False)
    
    # Status dan Verifikasi
    status = db.Column(db.String(20), default='pending')
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime, nullable=True)
    verified_by = db.Column(db.String(50), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    # Catatan
    notes = db.Column(db.Text, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order = db.relationship('Order', backref='payments', lazy=True)  # Note: backref is 'payments' (plural)
    user = db.relationship('User', foreign_keys=[user_id], backref='user_payments', lazy=True)
    verifier = db.relationship('User', foreign_keys=[verified_by], backref='verified_payments', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'orderId': self.order_id,
            'userId': self.user_id,
            'method': self.method,
            'accountName': self.account_name,
            'amount': float(self.amount),
            'proofImage': self.proof_image,
            'status': self.status,
            'uploadedAt': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'verifiedAt': self.verified_at.isoformat() if self.verified_at else None,
            'verifiedBy': self.verified_by,
            'notes': self.notes,
            'rejectionReason': self.rejection_reason,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }

class PaymentMethod(db.Model):
    __tablename__ = 'payment_methods'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    account_number = db.Column(db.String(100), nullable=False)
    account_holder = db.Column(db.String(255), nullable=False)
    icon = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    display_order = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'name': self.name,
            'account': self.account_number,
            'holder': self.account_holder,
            'icon': self.icon,
            'isActive': self.is_active,
            'displayOrder': self.display_order,
        }

