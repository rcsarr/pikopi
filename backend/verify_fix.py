import sys
import os

# Add the backend directory to the python path
sys.path.append(r"C:\Users\M RIzky Caesar\Documents\Semester 5\web\backend")

try:
    from app import create_app
    app = create_app()
    print("✅ App created successfully!")
except Exception as e:
    print(f"❌ Failed to create app: {e}")
    sys.exit(1)
