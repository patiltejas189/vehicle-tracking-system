#!/bin/bash

echo "========================================"
echo "Vehicle Tracking System - Electron Build"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    exit 1
fi

# Install Electron dependencies
print_status "Installing Electron dependencies..."
cd electron
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install Electron dependencies"
        cd ..
        exit 1
    fi
fi

# Build React app
print_status "Building React app..."
cd ../frontend
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build React app"
    cd ..
    exit 1
fi

# Build Electron app
print_status "Building Electron app..."
cd ../electron

# Detect platform and build accordingly
case "$(uname -s)" in
    Linux*)
        print_status "Building for Linux..."
        npm run build:linux
        ;;
    Darwin*)
        print_status "Building for macOS..."
        npm run build:mac
        ;;
    CYGWIN*|MINGW32*|MSYS*|MINGW*)
        print_status "Building for Windows..."
        npm run build:win
        ;;
    *)
        print_warning "Unknown platform, building for current platform..."
        npm run build:electron
        ;;
esac

if [ $? -ne 0 ]; then
    print_error "Failed to build Electron app"
    cd ..
    exit 1
fi

print_status "========================================"
print_status "Build completed successfully!"
print_status "========================================"
echo
print_status "Output files are in: electron/dist/"
echo
print_status "Installers:"
case "$(uname -s)" in
    Linux*)
        echo "  - Vehicle Tracking System-X.X.X.AppImage (Linux AppImage)"
        ;;
    Darwin*)
        echo "  - Vehicle Tracking System-X.X.X.dmg (macOS DMG)"
        ;;
    CYGWIN*|MINGW32*|MSYS*|MINGW*)
        echo "  - Vehicle Tracking System Setup X.X.X.exe (Windows installer)"
        ;;
    *)
        echo "  - Check electron/dist/ for platform-specific installers"
        ;;
esac
echo
print_status "Portable versions:"
echo "  - electron/dist/[platform]-unpacked/"
echo
print_status "To run the portable version:"
echo "  cd electron/dist/[platform]-unpacked/"
echo "  ./Vehicle Tracking System"
echo
print_status "Happy tracking! 🚗📱"