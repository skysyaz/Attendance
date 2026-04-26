# Staff Attendance App - Setup Guide

## How to Run for Free

### Option 1: Expo Go (Easiest - Free)
1. **Install Expo Go** on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Clone the project** and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   # or: npx expo start
   ```

4. **Scan QR code** with Expo Go app (or press `a` for Android emulator)

### Option 2: Web Browser (Free)
```bash
cd frontend
npm run web
```

### Option 3: Local APK Build (Free)

#### Prerequisites (Free downloads):
- **Node.js**: https://nodejs.org (free)
- **Java JDK 17**: https://adoptium.net (free)
- **Android Studio**: https://developer.android.com/studio (free)

#### Build Steps:

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Generate Android project**:
   ```bash
   npx expo prebuild --platform android
   ```

3. **Build APK**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

4. **APK Location**: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Architecture

- **Frontend**: React Native + Expo (Expo Router for navigation)
- **Backend**: Python FastAPI (see `/backend`)
- **Design**: Swiss-inspired high-contrast minimalist UI

## Tech Stack

- Expo SDK 54
- React Native 0.81
- React Navigation 7
- Axios for API calls
- expo-location for GPS
- date-fns for date handling

## API Configuration

Update `/frontend/src/config/index.ts` with your backend URL:
```typescript
export const API_BASE_URL = 'http://YOUR_SERVER_IP:8000';
```

## Scripts

```bash
cd frontend
npm start        # Start Expo dev server
npm run android # Run on Android emulator
npm run ios     # Run on iOS simulator
npm run web     # Run in browser
```

---

_This app requires a backend server for full functionality. See `/backend` folder for server setup._