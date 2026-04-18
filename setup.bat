@echo off
REM TileGenius - Windows Setup Script
REM Run this once to set up the project for local development

echo.
echo  ======================================
echo   TileGenius - Local Setup (Windows)
echo  ======================================
echo.

REM Check Node.js
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Node.js is not installed. Download from https://nodejs.org/
    exit /b 1
)
echo  [OK] Node.js: 
node --version

REM Check pnpm
pnpm --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  [INFO] Installing pnpm...
    npm install -g pnpm
)
echo  [OK] pnpm: 
pnpm --version

echo.
echo  [1/4] Installing dependencies...
pnpm install

echo.
echo  [2/4] Setting up environment...
IF NOT EXIST .env (
    copy .env.example .env
    echo  [OK] Created .env from .env.example - please fill in your DATABASE_URL and OPENAI_API_KEY
) ELSE (
    echo  [OK] .env already exists
)

echo.
echo  [3/4] Pushing database schema...
pnpm --filter @workspace/db run push

echo.
echo  [4/4] Seeding tile catalog...
pnpm --filter @workspace/scripts run seed-tiles

echo.
echo  ======================================
echo   Setup Complete!
echo  ======================================
echo.
echo  Start the API server (Terminal 1):
echo    pnpm --filter @workspace/api-server run dev
echo.
echo  Start the frontend (Terminal 2):
echo    pnpm --filter @workspace/tile-genius run dev
echo.
echo  Open: http://localhost:3000
echo.
