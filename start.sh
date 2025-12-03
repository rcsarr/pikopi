#!/bin/bash

# ========== Railway Start Script ==========
# File: start.sh (di root project)

echo "🚀 Starting Pilah Kopi Application..."

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  echo "❌ Error: backend/ and frontend/ directories not found"
  exit 1
fi

# ========== OPTION 1: Start Backend Only (Backend-focused) ==========
# Uncomment jika hanya deploy backend

# echo "📦 Starting Backend (Flask)..."
# cd backend
# pip install -r requirements.txt
# python app.py

# ========== OPTION 2: Start Frontend Only (Frontend-focused) ==========
# Uncomment jika hanya deploy frontend

# echo "🎨 Starting Frontend (React)..."
# cd frontend
# npm install
# npm run build
# npm run preview

# ========== OPTION 3: Start Both (Recommended untuk dev) ==========
# Uncomment untuk jalankan keduanya

# Start backend in background
echo "📦 Starting Backend..."
cd backend
pip install -r requirements.txt
python run.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "🎨 Starting Frontend..."
cd ../frontend
npm install
npm run dev

# Cleanup
wait $BACKEND_PID

# ========== ATAU: Use Railway Environment Variable ==========

# Detect what to run based on PORT or service name
if [ "$SERVICE_TYPE" = "backend" ] || [ -z "$SERVICE_TYPE" ]; then
  echo "📦 Starting Backend Service..."
  cd backend
  pip install -r requirements.txt
  gunicorn --bind 0.0.0.0:${PORT:-5000} app:app
elif [ "$SERVICE_TYPE" = "frontend" ]; then
  echo "🎨 Starting Frontend Service..."
  cd frontend
  npm install
  npm run build
  npm run preview -- --host 0.0.0.0
fi

echo "✅ Application started!"
