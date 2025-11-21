#!/bin/bash

echo "🚀 SafeSpace Local Development Setup"
echo "======================================"
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env not found!"
    echo "📝 Creating from example..."
    cp backend/.env.example backend/.env 2>/dev/null || cp .env.example backend/.env
    echo "⚠️  Please update backend/.env with your MongoDB connection string"
fi

if [ ! -f "frontend/.env" ]; then
    echo "❌ frontend/.env not found!"
    echo "📝 Creating from example..."
    echo "REACT_APP_BACKEND_URL=http://localhost:8001" > frontend/.env
fi

echo ""
echo "✅ Environment files ready"
echo ""
echo "📦 Installing Dependencies..."
echo ""

# Backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

echo ""
echo "Installing frontend dependencies..."
cd frontend
yarn install
cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Update backend/.env with your MongoDB connection string"
echo "2. Start MongoDB locally or use MongoDB Atlas"
echo "3. Run backend: cd backend && uvicorn server:app --reload --host 0.0.0.0 --port 8001"
echo "4. Run frontend: cd frontend && yarn start"
echo ""
echo "📖 For Vercel deployment, see VERCEL_DEPLOYMENT.md"
echo ""
