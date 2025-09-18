#!/bin/bash
# install.sh - Quick installation script

echo "🚀 Installing MTG Scanner dependencies..."

# Backend
echo "📦 Installing backend dependencies..."
cd mtg-scanner-backend
npm install
cd ..

# Frontend  
echo "🎨 Installing frontend dependencies..."
cd mtg-scanner-frontend
npm install
cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit mtg-scanner-backend/.env with your Azure credentials"
echo "2. Start backend: cd mtg-scanner-backend && npm run dev"
echo "3. Start frontend: cd mtg-scanner-frontend && npm start" 
echo ""
echo "🔗 Backend will run on http://localhost:3001"
echo "🌐 Frontend will run on http://localhost:3000"
