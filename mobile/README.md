# 🚗 Vehicle Tracking Mobile App (Android)

A React Native Android application for drivers to track GPS location and receive real-time alerts.

## 📱 Features

- **GPS Location Tracking** - Real-time location monitoring
- **Background Tracking** - Continuous tracking even when app is closed
- **Speed Monitoring** - Automatic alerts for speed violations
- **Interactive Maps** - View routes and current location
- **Push Notifications** - Real-time alerts and notifications
- **Offline Support** - Works with cached data
- **Driver Dashboard** - Personal statistics and trip history
- **Alert Management** - View and manage alerts

## 🛠️ Tech Stack

- **React Native** - Cross-platform mobile development
- **React Navigation** - Navigation and routing
- **React Native Maps** - Interactive maps
- **React Native Geolocation** - GPS location services
- **Background Actions** - Background GPS tracking
- **AsyncStorage** - Local data storage
- **Axios** - HTTP client for API calls

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and npm
- **Java Development Kit (JDK)** 11+
- **Android Studio** with Android SDK
- **Android device/emulator** API level 21+
- **Backend services** running (see main project)

### Installation

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Install Android dependencies:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

3. **Configure API endpoint:**
   Edit `mobile/src/context/AuthContext.js` and change:
   ```javascript
   const API_BASE_URL = 'http://192.168.1.100:5000'; // Change to your computer's IP
   ```

### Running the App

#### Development Mode
```bash
# Start Metro bundler
npm start

# In another terminal, run on Android
npm run android
```

#### Production Build
```bash
# Build APK
npm run build:apk

# Or build AAB (for Google Play)
cd android && ./gradlew bundleRelease
```

## 📋 Configuration

### API Configuration

**File:** `mobile/src/context/AuthContext.js`
```javascript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5000';
```

**To find your computer's IP:**
- Windows: `ipconfig`
- macOS: `ifconfig` or `ip addr`
- Linux: `hostname -I`

### Google Maps API (Optional)

For enhanced maps functionality, add your Google Maps API key:

**File:** `mobile/android/app/src/main/AndroidManifest.xml`
```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY" />
```

### Permissions

The app automatically requests these permissions:
- **Location** - For GPS tracking
- **Background Location** - For continuous tracking
- **Internet** - For API communication
- **Wake Lock** - To prevent sleep during tracking

## 🎯 App Structure

```
mobile/
├── src/
│   ├── context/
│   │   └── AuthContext.js      # Authentication state
│   ├── screens/
│   │   ├── LoginScreen.js      # Driver login
│   │   ├── DashboardScreen.js  # Driver dashboard
│   │   ├── TrackingScreen.js   # GPS tracking interface
│   │   ├── AlertsScreen.js     # Alert management
│   │   └── ProfileScreen.js    # Driver profile
│   └── components/             # Reusable components
├── android/                    # Android native code
│   └── app/
│       ├── src/main/
│       │   ├── java/com/vehicletracking/mobile/
│       │   └── AndroidManifest.xml
│       └── build.gradle
├── App.js                      # Main app component
├── package.json                # Dependencies
└── README.md
```

## 📱 User Flow

### Driver Experience

1. **Login** - Authenticate with username/password
2. **Dashboard** - View personal stats and quick actions
3. **GPS Tracking** - Start/stop location tracking
4. **Real-time Map** - See current location and route
5. **Alerts** - Receive speed/maintenance notifications
6. **Profile** - Manage personal information

### Key Features

#### GPS Tracking
- **Start Trip** - Begin location monitoring
- **Real-time Updates** - GPS data sent every 30 seconds
- **Speed Alerts** - Automatic notifications for violations
- **Route Mapping** - Visual route display
- **Background Mode** - Tracking continues when app closed

#### Dashboard
- **Today's Stats** - Distance, trips, average speed
- **Total Statistics** - Overall performance metrics
- **Quick Actions** - Fast access to common tasks
- **Recent Alerts** - Latest notifications

#### Alerts System
- **Speed Violations** - Over 80 km/h alerts
- **Maintenance Reminders** - Service due notifications
- **Geofence Alerts** - Entry/exit zone notifications
- **Fuel Alerts** - Low fuel warnings

## 🔧 Development

### Adding New Features

1. **Create Screen Component:**
   ```javascript
   // src/screens/NewScreen.js
   import React from 'react';
   // ... component code
   ```

2. **Add to Navigation:**
   ```javascript
   // App.js - Add to Tab Navigator
   <Tab.Screen name="NewScreen" component={NewScreen} />
   ```

3. **Add API Calls:**
   ```javascript
   // Use existing AuthContext for authenticated requests
   const { user } = useAuth();
   ```

### Testing GPS Features

1. **Enable Mock Locations** (Android Settings)
2. **Use Android Emulator** with location simulation
3. **Test Background Tracking** - Minimize app and check tracking

### Debugging

```bash
# View device logs
adb logcat

# Debug React Native
npm start -- --reset-cache

# Android Studio debugging
# Open android/ in Android Studio
```

## 📦 Build & Deployment

### Generating APK

```bash
# Debug APK
npm run android -- --mode=debug

# Release APK
npm run build:apk

# Find APK at: android/app/build/outputs/apk/release/
```

### Google Play Store

1. **Generate Signed APK/AAB:**
   ```bash
   # Create keystore
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

   # Build signed bundle
   cd android && ./gradlew bundleRelease
   ```

2. **Upload to Play Console**
3. **Configure App Details**
4. **Publish**

## 🐛 Troubleshooting

### Common Issues

#### App Won't Start
```bash
# Clear React Native cache
npm start -- --reset-cache

# Clean Android build
cd android && ./gradlew clean && cd ..
```

#### GPS Not Working
- Check location permissions in Android settings
- Enable GPS/location services
- Test with device instead of emulator

#### Network Errors
- Verify backend is running
- Check API_BASE_URL in AuthContext.js
- Ensure device can reach backend IP

#### Build Errors
```bash
# Clean all caches
cd android && ./gradlew clean && cd ..
rm -rf node_modules && npm install
npm start -- --reset-cache
```

### Performance Tips

- **Minimize re-renders** - Use React.memo for components
- **Optimize images** - Compress map markers and icons
- **Background tasks** - Use proper background service configuration
- **Memory management** - Clear subscriptions on unmount

## 📋 Requirements

### Development
- **Node.js** 16.0.0+
- **npm** 7.0.0+
- **JDK** 11+
- **Android SDK** API 21+
- **Android Studio** 2020.3+

### Device Requirements
- **Android** 5.0+ (API 21)
- **RAM** 2GB minimum
- **Storage** 100MB free space
- **GPS** hardware required

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check troubleshooting section
2. Review existing issues
3. Create detailed bug report with:
   - Android version
   - Device model
   - Steps to reproduce
   - Error logs

---

**Built with ❤️ using React Native for Android drivers**