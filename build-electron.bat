@echo off
echo ========================================
echo Vehicle Tracking System - Electron Build
echo ========================================

echo.
echo Checking prerequisites...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing Electron dependencies...
cd electron
if not exist node_modules (
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Electron dependencies
        cd ..
        pause
        exit /b 1
    )
)

echo.
echo Building React app...
cd ../frontend
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build React app
    cd ..
    pause
    exit /b 1
)

echo.
echo Building Electron app...
cd ../electron
npm run build:win
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Electron app
    cd ..
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Output files are in: electron\dist\
echo.
echo Installers:
echo - Vehicle Tracking System Setup X.X.X.exe (Windows installer)
echo.
echo Portable version:
echo - electron\dist\win-unpacked\ (run Vehicle Tracking System.exe)
echo.
pause