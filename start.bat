@echo off
title Thanmaya Clinic Pharmacy Inventory
echo =======================================================
echo Thanmaya Clinic Pharmacy Inventory System Starting...
echo =======================================================

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/ before running this app.
    echo Press any key to exit...
    pause >nul
    exit /b
)

echo [INFO] Node.js detected.

:: Check if backend node_modules exist
if not exist backend\node_modules (
    echo [INFO] Installing backend dependencies...
    call npm run install:backend
)

:: Check if frontend node_modules exist
if not exist frontend\node_modules (
    echo [INFO] Installing frontend dependencies...
    call npm run install:frontend
)

:: Check if frontend dist folder exists
if not exist frontend\dist (
    echo [INFO] Building frontend static assets...
    call npm run build
)

echo [INFO] Starting inventory server on http://localhost:5000 ...
echo [INFO] Opening default browser...
start http://localhost:5000

:: Run the Express backend server
call npm start
