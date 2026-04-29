# Staff Attendance App — Complete Setup Guide

This guide covers:
- Prerequisites (Windows + Linux)
- Running the backend (FastAPI + MongoDB)
- Running the frontend (Expo / React Native)
- Building an APK for Android
- Useful commands

> 💡 **Platform note**: Commands are shown for both platforms.
> - 🪟 = Windows
> - 🐧 = Linux

---

## Prerequisites

### 1. Python 3.10+
Check:
```bash
python --version
```
- 🪟 Download from https://www.python.org/downloads/ — check "Add Python to PATH" during install
- 🐧 `sudo apt install python3 python3-venv python3-pip`

### 2. Node.js 18+
Check:
```bash
node --version
```
- 🪟 Download from https://nodejs.org/ (LTS) **or** `winget install OpenJS.NodeJS.LTS`
- 🐧 `sudo apt install nodejs npm` (or use nvm: https://github.com/nvm-sh/nvm)

### 3. MongoDB
**Option A — Local MongoDB:**
- 🪟 Download MongoDB Community Server: https://www.mongodb.com/try/download/community
  - Run the `.msi` installer, select "Complete" install
  - Start the service:
    ```
    net start MongoDB
    ```
- 🐧
  ```bash
  sudo apt install -y mongodb-org
  sudo systemctl start mongod
  sudo systemctl enable mongod
  ```

**Option B — MongoDB Atlas (cloud, free tier):**
- Go to: https://www.mongodb.com/cloud/atlas
- Create a free cluster → get the connection string
- It looks like: `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/`
- Works identically on both platforms

### 4. JDK 17 (for building APK)
Check:
```bash
java -version
```
- 🪟 `winget install Microsoft.OpenJDK.17` **(or)** download from https://adoptium.net/
- 🐧 `sudo apt install openjdk-17-jdk`

### 5. Android Studio (includes Android SDK)
Install from: https://developer.android.com/studio

- 🪟 Run the `.exe` installer
- 🐧 Extract the `.tar.gz` and run `studio.sh`

**After installation:**
- Open Android Studio → **Tools → SDK Manager**
- Check and install:
  - ✅ Android SDK Platform-Tools
  - ✅ Android SDK Build-Tools (latest)
  - ✅ Android SDK Command-line Tools
- Create an environment variable:
  - 🪟 `ANDROID_HOME` → `C:\Users\<YourUser>\AppData\Local\Android\Sdk`
    - Run in CMD to verify: `echo %ANDROID_HOME%`
  - 🐧 Add to `~/.bashrc`:
    ```bash
    export ANDROID_HOME=$HOME/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools
    ```
    Then run: `source ~/.bashrc`

### 6. Expo CLI + EAS
```bash
npm install -g eas-cli
```

### 7. Git
- 🪟 https://git-scm.com/download/win **or** `winget install Git.Git`
- 🐧 `sudo apt install git`

---

## Quick Start

```bash
git clone https://github.com/skysyaz/Attendance.git
cd Attendance
```

---

## Part 1 — Backend (FastAPI)

### Step 1: Create the .env file
```
🪟 cd backend
🪟 type nul > .env
🪟 notepad .env

🐧 cd backend
🐧 nano .env
```

**`.env` contents** (same on both platforms):
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=attendance
JWT_SECRET=your-super-secret-key-change-this
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=admin123
```

> If using MongoDB Atlas, replace `MONGO_URL` with your Atlas connection string:
> ```
> MONGO_URL=mongodb+srv://user:pass@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority
> ```

### Step 2: Create virtual environment and install dependencies

- 🪟
  ```
  cd backend
  python -m venv venv
  venv\Scripts\activate
  pip install -r requirements.txt
  ```
- 🐧
  ```bash
  cd backend
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  ```

### Step 3: Start the server

- 🪟
  ```
  cd backend
  venv\Scripts\activate
  uvicorn server:app --host 0.0.0.0 --port 8001 --reload
  ```
- 🐧
  ```bash
  cd backend
  source venv/bin/activate
  uvicorn server:app --host 0.0.0.0 --port 8001 --reload
  ```

The API will be available at:
- **http://localhost:8001**
- **API docs (Swagger)**: http://localhost:8001/docs

> **On first startup**, the backend automatically:
> - Creates indexes in MongoDB
> - Seeds an admin user (`admin@company.com` / `admin123`)
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
```
🪟 type nul > .env
🪟 notepad .env

🐧 nano .env
```

**`.env` contents:**

For a **real phone** on the same Wi-Fi (you need your laptop's IP):
```
EXPO_PUBLIC_BACKEND_URL=http://<YOUR_LAN_IP>:8001
```

**Find your laptop's IP:**
- 🪟 Open CMD → `ipconfig` → look for `IPv4 Address` (usually `192.168.x.x`)
- 🐧 `ip addr show | grep "inet " | grep -v 127.0.0.1`

For **Android emulator** (built-in special routing):
```
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8001
```

### Step 3: Start Expo
```bash
cd frontend
npx expo start
```

This opens Expo DevTools in your browser. Options:
- **Scan QR code** with the **Expo Go** app (from Play Store / App Store) — phone must be on the same Wi-Fi
- Press `a` to launch on Android emulator
- Press `i` to launch on iOS simulator

---

## Part 3 — Build APK (Android)

### Option A: EAS Build (Recommended — Cloud Build, Works on Both Platforms)

This is the easiest method — Expo's cloud servers build the APK for you. No local Android SDK needed (though having it helps).

```bash
cd frontend

# Login to Expo (create free account if needed: https://expo.dev)
eas login

# Configure EAS (creates eas.json)
eas build:configure

# Build APK (cloud)
eas build --platform android --profile preview
```

When the build finishes, you get a download link. The APK works on any Android device.

### Option B: Local Build (Requires Android SDK installed)

- 🪟
  ```
  cd frontend
  npx expo prebuild --platform android
  cd android
  gradlew.bat clean
  gradlew.bat assembleRelease
  ```
  The APK will be at:
  ```
  frontend\android\app\build\outputs\apk\release\app-release.apk
  ```

- 🐧
  ```bash
  cd frontend
  npx expo prebuild --platform android
  cd android
  ./gradlew clean
  ./gradlew assembleRelease
  ```
  The APK will be at:
  ```
  frontend/android/app/build/outputs/apk/release/app-release.apk
  ```

> **⚠️ Note**: `assembleRelease` requires a signing keystore. For first-time local builds, use this instead to get a debug APK:
> - 🪟 `gradlew.bat assembleDebug` → APK at `app\build\outputs\apk\debug\app-debug.apk`
> - 🐧 `./gradlew assembleDebug` → APK at `app/build/outputs/apk/debug/app-debug.apk`

### Option C: Expo Dev Client APK (Debuggable, Best for Testing)

```bash
cd frontend

# Install expo-dev-client
npx expo install expo-dev-client

# Build (local) - requires Android SDK
eas build --platform android --profile development --local

# OR build (cloud) - no local SDK needed
eas build --platform android --profile development
```

Install the resulting APK on any Android device for full testing access.

---

## Useful Commands

### Backend
```
🪟
cd backend
venv\Scripts\activate

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

🐧
cd backend
source venv/bin/activate

# Same commands as above...
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
| **Backend: can't connect to MongoDB** | Check `MONGO_URL` in `.env`. 🪟 Ensure `net start MongoDB` runs. 🐧 Run `sudo systemctl status mongod` |
| **Frontend: can't reach backend** | Make sure `EXPO_PUBLIC_BACKEND_URL` uses your laptop's LAN IP (not `localhost`) when testing on a real phone |
| **Expo QR code won't connect** | Phone and laptop must be on the **same Wi-Fi network**. Check Windows Firewall / ufw isn't blocking port 8081 |
| **APK build fails (missing SDK)** | Install Android Studio → SDK Manager → install Platform-Tools + Build-Tools. Set `ANDROID_HOME` env var |
| **`uvicorn: command not found`** | 🪟 Run `venv\Scripts\activate` **🐧 Run `source venv/bin/activate`** — you must activate the venv |
| **EAS build asks for account** | Run `eas login` or create a free Expo account at https://expo.dev |
| **Windows: Python not found after install** | Re-run the Python installer and make sure "Add Python to PATH" is checked |
| **Windows: gradlew.bat not recognized** | Install JDK 17 (`winget install Microsoft.OpenJDK.17`) and ensure `JAVA_HOME` is set |
| **Windows: firewall blocks Expo** | Settings → Firewall → Allow an app → add `node.exe` for both Public and Private networks |
| **Linux: port 8001 already in use** | `sudo lsof -i :8001` to find the process, then `sudo kill <PID>` |
| **MongoDB: auth failed (Atlas)** | Make sure your IP is whitelisted in Atlas under Network Access → add `0.0.0.0/0` (all IPs) for testing |
