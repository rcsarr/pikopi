

from app import create_app, db
from app.models.user import User
from app.routes.auth import generate_user_id
import secrets
import string

def generate_secure_password(length=16):
    """Generate secure random password"""
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(characters) for _ in range(length))

def create_admin_user():
    app = create_app()
    
    with app.app_context():
        # Check if admin user exists
        admin_email = 'admin@pilahkopi.id'
        admin_user = User.query.filter(User.email.ilike(admin_email)).first()
        
        if admin_user:
            print(f"✅ Admin user already exists: {admin_user.email}")
            print(f"   ID: {admin_user.id}")
            print(f"   Name: {admin_user.name}")
            print(f"   Role: {admin_user.role}")
            
            # Pastikan role adalah admin
            if admin_user.role != 'admin':
                print(f"\n⚠️  Role tidak 'admin', mengupdate...")
                admin_user.role = 'admin'
                db.session.commit()
                print(f"✅ Role updated to 'admin'")
            
            return
        
        # Generate secure password
        password = generate_secure_password()
        
        # Create admin user
        admin = User(
            id=generate_user_id(),  # ✅ Gunakan function untuk ID yang unik
            email=admin_email,
            name='Admin PilahKopi',
            phone='081234567890',
            role='admin',
            is_active=True,
            email_verified=True
        )
        
        admin.set_password(password)
        
        try:
            db.session.add(admin)
            db.session.commit()
            
            print(f"✅ Admin user created successfully!")
            print(f"   Email: {admin.email}")
            print(f"   ID: {admin.id}")
            print(f"   Name: {admin.name}")
            print(f"   Role: {admin.role}")
            print(f"\n🔐 Credentials:")
            print(f"   Email: {admin.email}")
            print(f"   Password: {password}")
            print(f"\n⚠️  SIMPAN PASSWORD INI DI TEMPAT AMAN!")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating admin user: {str(e)}")
            
            # Check if user with same email exists
            existing = User.query.filter_by(email=admin_email).first()
            if existing:
                print(f"   User dengan email ini sudah ada!")
                print(f"   ID: {existing.id}")

if __name__ == '__main__':
    create_admin_user()
