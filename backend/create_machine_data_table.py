from app import create_app, db
from app.models.machine_data import MachineData
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Recreating machines_data table...")
    # Drop table if exists to ensure schema update
    db.session.execute(text('DROP TABLE IF EXISTS machines_data CASCADE'))
    db.session.commit()
    
    db.create_all()
    print("Table created successfully!")

    # Optional: Insert dummy data if empty
    if MachineData.query.count() == 0:
        print("Inserting dummy data...")
        dummy_data = [
            MachineData(
                id='MD_001',
                machine_id='MCH-001',
                temperature=45.5,
                processed_today=150,
                remaining_batch=20,
                efficiency=95.5,
                error_rate=2.5
            ),
            MachineData(
                id='MD_002',
                machine_id='MCH-002',
                temperature=42.0,
                processed_today=120,
                remaining_batch=10,
                efficiency=92.0,
                error_rate=3.0
            ),
             MachineData(
                id='MD_003',
                machine_id='MCH-003',
                temperature=0.0,
                processed_today=0,
                remaining_batch=0,
                efficiency=0.0,
                error_rate=0.0
            )
        ]
        db.session.add_all(dummy_data)
        db.session.commit()
        print("Dummy data inserted!")
