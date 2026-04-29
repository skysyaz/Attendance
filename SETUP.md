# Staff Attendance App — Complete Setup Guide

This guide covers:
- Prerequisites
- Running the backend (FastAPI + MongoDB)
- Running the frontend (Expo / React Native)
- Building an APK for Android
- Useful commands

---

## Prerequisites

### 1. Python 3.10+
Check:
```bash
python3 --version
```

### 2. Node.js 18+
Check:
```bash
node --version
```

### 3. MongoDB
Option A — Local MongoDB:
```bash
# Linux (Ubuntu)
sudo apt install -y mongodb-org
sudo systemctl start mongod
```

Option B — MongoDB Atlas (cloud, free tier):
- Go to: https://www.mongodb.com/cloud/atlas
- Create a free cluster → get the connection string
- It looks like: `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/`

### 4. JDK 17 (for building APK)
```bash
sudo apt install openjdk-17-jdk
java -version
```

### 5. Android SDK / Build Tools
The easiest way is to install **Android Studio** (https://developer.android.com/studio) which includes the SDK, platform-tools, and build-tools automatically.

After installing Android Studio, verify:
```bash
echo $ANDROID_HOME
# Should be: ~/Android/Sdk
```

### 6. Expo CLI + EAS
```bash
npm install -g eas-cli
```

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/skysyaz/Attendance.git
cd Attendance
```

---

## Part 1 — Backend (FastAPI)

### Step 1: Create the .env file
```bash
cd backend
cp .env.example .env    # or create manually
nano .env
```

**`.env` contents:**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=attendance
JWT_SECRET=your-super-secret-key-change-this
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=admin123
```

If using MongoDB Atlas, set:
```
MONGO_URL=mongodb+srv://user:pass@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority
```

### Step 2: Create virtual environment and install dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Start the server
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

The API will be available at:
- **http://localhost:8001**
- **API docs**: http://localhost:8001/docs

> **Note**: On first startup, the backend automatically:
> - Seeds an admin user (admin@company.com / admin123)
> - Seeds two sample offices (San Francisco, New York)

---

## Part 2 — Frontend (Expo / React Native)

### Step 1: Install dependencies
```bash
cd frontend
yarn install
# or: npm install
```

### Step 2: Create the .env file
```bash
cd frontend
nano .env
```

**`.env` contents:**

For local testing on the same machine (device connected via USB):
```
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8001
```

Replace `192.168.1.100` with your laptop's local IP address. Find it with:
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
# or (macOS):
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Step 3: Start Expo
```bash
cd frontend
npx expo start
```

This opens the Expo DevTools in your browser. Options:
- **Scan QR code** with Expo Go app (from App Store / Play Store) on your phone
- Press `a` to launch on Android emulator
- Press `i` to launch on iOS simulator

### Step 4: Connecting on the same machine (testing via emulator)
If running on Android emulator (`http://10.0.2.2` refers to host machine):
```
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8001
```

---

## Part 3 — Build APK (Android)

### Option A: EAS Build (Recommended — cloud build)

```bash
cd frontend

# Login to Expo
eas login

# Configure EAS (creates eas.json)
eas build:configure

# Build APK
eas build --platform android --profile preview
```

This uploads the project to Expo's cloud servers and builds the APK remotely. When done, you get a download link.

### Option B: Local Build (requires Android SDK installed)

```bash
cd frontend

# Prebuild the native project
npx expo prebuild --platform android

# Install native dependencies
cd android
./gradlew clean

# Build the APK
./gradlew assembleRelease
```

The APK will be at:
```
frontend/android/app/build/outputs/apk/release/app-release.apk
```

> **Note**: For a production release build, you need a signing keystore:
> ```bash
> ./gradlew assembleRelease
> ```

### Option C: Expo dev client (debuggable APK for testing)

```bash
cd frontend

# Install expo-dev-client
npx expo install expo-dev-client

# Build a dev client APK
eas build --platform android --profile development --local
```

This creates a debuggable APK you can install on any Android device for testing.

---

## Useful Commands

### Backend
```bash
cd backend
source venv/bin/activate

# Start dev server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Run tests
pytest tests/ -v

# Format code
black .
isort .

# Lint
flake8 .
mypy .
```

### Frontend
```bash
cd frontend

# Start dev server
npx expo start

# Start with clear cache
npx expo start --clear

# Lint
npx expo lint

# TypeScript check
npx tsc --noEmit

# Build for web
npx expo export --platform web
```

### Git
```bash
# Check status
git status

# Add and commit
git add .
git commit -m "your message"

# Push
git push origin main

# See remote
git remote -v
```

---

## Architecture

```
┌─────────────────────┐
│   Mobile (Expo)     │  ◄── React Native + TypeScript
│   frontend/src/     │
│   app/(admin)/      │
└──────────┬──────────┘
           │  HTTP + Bearer Token
           ▼
┌─────────────────────┐
│   Backend (FastAPI) │  ◄── Python + FastAPI
│   backend/server.py │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   MongoDB           │
│   (users, offices,  │
│    attendance)      │
└─────────────────────┘
```

---

## Troubleshooting

| Problem | Solution |
|--------|----------|
| Backend can't connect to MongoDB | Check `MONGO_URL` in `.env`; ensure MongoDB is running with `sudo systemctl status mongod` |
| Frontend can't reach backend | Make sure `EXPO_PUBLIC_BACKEND_URL` uses your laptop's LAN IP (not localhost) when testing on a real phone |
| Expo QR code won't connect | Ensure phone and laptop are on the same Wi-Fi network |
| APK build fails (missing SDK) | Install Android Studio → Tools → SDK Manager → install "Android SDK Platform-Tools" and "Build-Tools" |
| `uvicorn: command not found` | Make sure you activated the venv: `source venv/bin/activate` |
| EAS build asks for account | Run `eas login` or create a free Expo account at https://expo.dev |
