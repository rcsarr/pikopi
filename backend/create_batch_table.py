import os
import sys

# Add the current directory to python path
sys.path.append(os.getcwd())

from app import create_app, db
from app.models.sorting_batch import SortingBatch

app = create_app()

with app.app_context():
    print("🔧 Creating sorting_batches table...")
    try:
        # Create specific table
        SortingBatch.__table__.create(db.engine)
        print("✅ Table 'sorting_batches' created successfully!")
            
    except Exception as e:
        print(f"❌ Error creating table: {e}")
