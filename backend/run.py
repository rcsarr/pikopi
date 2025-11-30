from app import create_app
from apscheduler.schedulers.background import BackgroundScheduler
import psycopg2
from psycopg2 import sql
import socket
import random
from datetime import datetime


app = create_app()

DB_CONFIG = {
    'host': 'localhost',
    'database': 'pilahkopi_db',
    'user': 'postgres',
    'password': 'czartekom',
    'port': 5432
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def update_sorting_results_ord001():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return
    
    try:
        cur = conn.cursor()
        
        total_beans = random.randint(60, 70)
        healthy_beans = random.randint(45, 60)
        defective_beans = total_beans - healthy_beans
        
        healthy_percentage = round((healthy_beans / total_beans) * 100, 2)
        defective_percentage = round((defective_beans / total_beans) * 100, 2)
        
        total_weight = round(total_beans * random.uniform(0.9, 1.1), 2)
        healthy_weight = round(total_weight * (healthy_percentage / 100), 2)
        defective_weight = total_weight - healthy_weight
        
        accuracy = round(random.uniform(85, 98), 2)
        
        update_query = sql.SQL("""
            UPDATE sorting_results
            SET 
                total_beans = %s,
                healthy_beans = %s,
                defective_beans = %s,
                healthy_percentage = %s,
                defective_percentage = %s,
                total_weight = %s,
                healthy_weight = %s,
                defective_weight = %s,
                accuracy = %s,
                sorted_at = NOW()
            WHERE order_id = %s
        """)
        
        cur.execute(update_query, (
            total_beans,
            healthy_beans,
            defective_beans,
            healthy_percentage,
            defective_percentage,
            total_weight,
            healthy_weight,
            defective_weight,
            accuracy,
            'ORD-001'
        ))
        
        conn.commit()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] ✓ Updated ORD-001 | Beans: {total_beans} | Healthy: {healthy_beans} | Accuracy: {accuracy}%")
        
        cur.close()
        
    except Exception as e:
        print(f"Error updating data: {e}")
        conn.rollback()
    finally:
        conn.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    
    scheduler.add_job(
        func=update_sorting_results_ord001,
        trigger="interval",
        seconds=5,
        id='update_ord001',
        name='Update ORD-001 every 5 seconds',
        replace_existing=True
    )
    
    scheduler.start()
    print("\n✓ Scheduler started! Updating ORD-001 every 5 seconds...\n")
    return scheduler



if __name__ == '__main__':
    # Fixed port 5010
    port = 5010
    
    # Check if port is available
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    
    if result == 0:
        print(f"❌ Port {port} sudah digunakan!")
        print(f"💡 Solusi:")
        print(f"   1. Stop proses yang menggunakan port {port}")
        print(f"   2. Atau ubah port di run.py")
        print(f"")
        print(f"   Cek proses yang menggunakan port {port}:")
        print(f"   Get-NetTCPConnection -LocalPort {port} | Select-Object OwningProcess, State")
        exit(1)
    
    print(f"🚀 Starting Flask server on http://localhost:{port}")
    print(f"📡 API endpoints available at http://localhost:{port}/api")
    print(f"⏳ Please wait for server to be ready...")
    print(f"")
    
    # Start scheduler
    scheduler = start_scheduler()
    
    # Disable reloader untuk stabilitas port
    try:
        app.run(debug=True, host='0.0.0.0', port=port, use_reloader=False, use_debugger=True)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {port} sudah digunakan oleh aplikasi lain")
            print(f"💡 Coba stop aplikasi lain dengan:")
            print(f"   Get-Process python | Stop-Process -Force")
        else:
            print(f"❌ Error starting server: {e}")
        exit(1)
    finally:
        # Shutdown scheduler saat server stop
        if scheduler:
            scheduler.shutdown()
