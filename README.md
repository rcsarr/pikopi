# Pilah Kopi - Bean Sorting & Payment System

Aplikasi web untuk tracking proses sorting kacang dan sistem pembayaran.


## 🏗️ Struktur Project

pilah-kopi/
├── backend/ # Flask API + Scheduler
├── frontend/ # React frontend
└── README.md

text

## 🚀 Quick Start

### Backend Setup

cd backend
pip install -r requirements.txt
python run.py

text

Server akan jalan di `http://localhost:5010`

### Frontend Setup

cd frontend
npm install
npm start

text

Frontend akan jalan di `http://localhost:3000`

## 📋 Requirements

### Backend
- Python 3.8+
- Flask
- PostgreSQL
- APScheduler

### Frontend
- Node.js 14+
- React
- Axios/Fetch

## 🔧 Configuration

### Backend (.env)

DB_HOST=localhost
DB_PORT=5432
DB_NAME=pilah_kopi
DB_USER=postgres
DB_PASSWORD=your_password
FLASK_PORT=5010

text

### Database

Create database:
CREATE DATABASE pilah_kopi;

text

## 📚 API Endpoints

- `GET /api/sorting/<order_id>` - Get current sorting result
- `GET /api/sorting/<order_id>/history` - Get sorting history
- `POST /api/payments/upload` - Upload payment proof
- `GET /api/payments/<payment_id>` - Get payment details

## 📝 License

MIT License

## 👤 Author

Kelompok 5 - Hi-5