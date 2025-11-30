from app import db
from datetime import datetime

class Order(db.Model):
    __tablename__ = 'orders'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    user_name = db.Column(db.String(255), nullable=True)  # ✅ Pastikan nullable=True
    package_name = db.Column(db.String(100), nullable=False)
    weight = db.Column(db.Float, nullable=False)
    price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')
    payment_status = db.Column('payment_status', db.String(20), default='pending')
    
    # Optional fields
    customer_name = db.Column(db.String(255), nullable=True)
    customer_phone = db.Column(db.String(50), nullable=True)
    customer_email = db.Column(db.String(255), nullable=True)
    customer_address = db.Column(db.Text, nullable=True)
    coffee_type = db.Column(db.String(50), nullable=True)
    delivery_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Machine assignment
    machine_id = db.Column(db.String(50), nullable=True)
    machine_name = db.Column(db.String(100), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
 
    
    @property
    def paymentStatus(self):
        return self.payment_status
    
    @paymentStatus.setter
    def paymentStatus(self, value):
        self.payment_status = value
    # Relationship
    user = db.relationship('User', backref=db.backref('orders', lazy=True))
    sorting_result = db.relationship(
        'SortingResult', 
        foreign_keys='SortingResult.order_id',
        backref='order',
        uselist=False,  # One-to-one relationship
        lazy=True
    )
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'userName': self.user_name,
            'userEmail': self.user.email if self.user else None,
            'userPhone': self.user.phone if self.user and hasattr(self.user, 'phone') else None,
            'packageName': self.package_name,
            'weight': self.weight,
            'price': self.price,
            'status': self.status,
            'paymentStatus': self.payment_status,
            'customerName': self.customer_name,
            'customerPhone': self.customer_phone,
            'customerEmail': self.customer_email,
            'customerAddress': self.customer_address,
            'coffeeType': self.coffee_type,
            'deliveryDate': self.delivery_date.isoformat() if self.delivery_date else None,
            'deliveryDate': self.delivery_date.isoformat() if self.delivery_date else None,
            'notes': self.notes,
            'machineId': self.machine_id,
            'machineName': self.machine_name,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,

            'sortingResults': {
                'total_beans': self.sorting_result.total_beans,
                'healthy_beans': self.sorting_result.healthy_beans,
                'defective_beans': self.sorting_result.defective_beans,
                'healthy_percentage': self.sorting_result.healthy_percentage,
                'defective_percentage': self.sorting_result.defective_percentage,
                'accuracy': self.sorting_result.accuracy,
            } if self.sorting_result else None,
            
            # ✅ Include payment data if exists
            'payment': self.payments[0].to_dict() if self.payments else None
        }
