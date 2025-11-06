#!/bin/bash

# Owly Analytics - Quick Setup Script

set -e

echo "🦉 Owly Analytics - Setup Script"
echo "=================================="
echo ""

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed"
echo ""

# Setup Backend
echo "📦 Setting up backend..."
cd backend

# Copy env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
fi

# Start database
echo "🐘 Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Install Python dependencies
if command -v poetry >/dev/null 2>&1; then
    echo "📚 Installing Python dependencies with Poetry..."
    poetry install
else
    echo "⚠️  Poetry not found. Please install it with:"
    echo "   curl -sSL https://install.python-poetry.org | python3 -"
    echo "   Then run: poetry install"
fi

cd ..

# Setup Extension
echo ""
echo "📦 Setting up extension..."
cd extension

# Install Node dependencies
echo "📚 Installing Node dependencies..."
npm install

# Build extension
echo "🔨 Building extension..."
npm run build

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1️⃣  Start the backend server:"
echo "   cd backend"
echo "   poetry run python -m app.main"
echo "   (or: poetry run uvicorn app.main:app --reload)"
echo ""
echo "2️⃣  Load the extension in Chrome:"
echo "   • Open chrome://extensions/"
echo "   • Enable 'Developer mode'"
echo "   • Click 'Load unpacked'"
echo "   • Select: $(pwd)/extension/dist"
echo ""
echo "3️⃣  Start browsing and check your analytics!"
echo ""
echo "💡 Verify backend is running:"
echo "   curl http://localhost:3000/health"
echo ""
echo "📚 For more info, see README.md"
echo ""
