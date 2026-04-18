#!/bin/bash
# TileGenius — Local Setup Script (Mac / Linux)

set -e

echo ""
echo "======================================"
echo "  TileGenius - Local Setup"
echo "======================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Download from https://nodejs.org/"
    exit 1
fi
echo "[OK] Node.js: $(node --version)"

# Check/install pnpm
if ! command -v pnpm &> /dev/null; then
    echo "[INFO] Installing pnpm..."
    npm install -g pnpm
fi
echo "[OK] pnpm: $(pnpm --version)"

echo ""
echo "[1/5] Installing Node.js dependencies..."
pnpm install

echo ""
echo "[2/5] Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "[OK] Created .env from .env.example"
    echo "     >>> Please edit .env and fill in DATABASE_URL and OPENAI_API_KEY <<<"
else
    echo "[OK] .env already exists"
fi

echo ""
echo "[3/5] Pushing database schema..."
pnpm --filter @workspace/db run push

echo ""
echo "[4/5] Seeding tile catalog (16 Somany tiles)..."
pnpm --filter @workspace/scripts run seed-tiles

echo ""
echo "[5/5] Setting up Python ML environment..."
if command -v pip3 &> /dev/null; then
    pip3 install -r ml/requirements.txt --quiet
    echo "[OK] Python ML dependencies installed"
elif command -v pip &> /dev/null; then
    pip install -r ml/requirements.txt --quiet
    echo "[OK] Python ML dependencies installed"
else
    echo "[WARN] pip not found. Install Python 3 to run ML scripts."
fi

echo ""
echo "======================================"
echo "  Setup Complete!"
echo "======================================"
echo ""
echo "  Start the API server (Terminal 1):"
echo "    pnpm --filter @workspace/api-server run dev"
echo ""
echo "  Start the frontend (Terminal 2):"
echo "    pnpm --filter @workspace/tile-genius run dev"
echo ""
echo "  Run ML Recommendation Demo:"
echo "    python3 ml/recommend.py"
echo "    python3 ml/recommend.py --tile-id 2 --top-k 4"
echo "    python3 ml/recommend.py --query \"warm bathroom tiles\""
echo ""
echo "  Run Analytics Report:"
echo "    python3 ml/analytics.py"
echo ""
echo "  Open: http://localhost:3000"
echo ""
