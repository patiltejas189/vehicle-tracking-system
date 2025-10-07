@echo off
echo Building Vehicle Tracking Desktop App...
echo.

echo Step 1: Building React frontend...
cd ../frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
cd ../electron
echo Frontend build completed.
echo.

echo Step 2: Creating Electron executable...
if not exist "dist" mkdir dist

echo Creating portable executable...
npx electron-builder --win --dir --publish=never
if %errorlevel% neq 0 (
    echo ERROR: Electron build failed!
    echo Trying alternative build method...
    echo.

    echo Attempting to create executable manually...
    npx electron-packager . "Vehicle Tracking System" --platform=win32 --arch=x64 --out=dist --overwrite
    if %errorlevel% neq 0 (
        echo ERROR: Manual build also failed!
        echo Please check the error messages above.
        pause
        exit /b 1
    )
)

echo.
echo Build completed successfully!
echo.
echo Your executable is located at:
echo electron\dist\win-unpacked\Vehicle Tracking System.exe
echo.
echo You can run this executable directly or create an installer.
echo.
pause