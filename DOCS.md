# Attendo — Developer Documentation

> GPS-based staff attendance tracker  
> Stack: FastAPI + MongoDB (backend) · React Native / Expo (frontend)

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Structure](#2-project-structure)
3. [Backend Setup & Run](#3-backend-setup--run)
4. [Frontend Setup & Run](#4-frontend-setup--run)
5. [Environment Variables](#5-environment-variables)
6. [Running Tests](#6-running-tests)
7. [Build APK (Android)](#7-build-apk-android)
8. [Default Credentials](#8-default-credentials)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

Install these on your laptop before starting.

### Required

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.11+ | https://python.org |
| Node.js | 18+ LTS | https://nodejs.org |
| Yarn | 1.22+ | `npm install -g yarn` |
| MongoDB Community | 7.x | https://www.mongodb.com/try/download/community |
| Git | any | https://git-scm.com |

### For APK build (EAS Cloud — easiest, no Android Studio needed)
| Tool | Install |
|------|---------|
| EAS CLI | `npm install -g eas-cli` |
| Expo account | https://expo.dev (free) |

### For APK build (local — optional, advanced)
| Tool | Download |
|------|----------|
| Android Studio | https://developer.android.com/studio |
| Java JDK 17 | bundled with Android Studio |

---

## 2. Project Structure

```
Attendance/
├── backend/
│   ├── server.py              ← FastAPI app
│   ├── requirements.txt       ← Python dependencies
│   ├── .env                   ← Your local env vars (create this)
│   └── tests/
│       └── test_attendance_api.py
│
└── frontend/
    ├── app.json               ← Expo config
    ├── eas.json               ← EAS build profiles
    ├── package.json
    ├── .env                   ← Your frontend env vars (create this)
    ├── app/                   ← Expo Router screens
    │   ├── index.tsx
    │   ├── login.tsx
    │   ├── register.tsx
    │   ├── (staff)/
    │   └── (admin)/
    └── src/
        ├── api.ts
        ├── AuthContext.tsx
        ├── theme.ts
        ├── dateUtils.ts
        └── components/
            └── ProfileScreen.tsx
```

---

## 3. Backend Setup & Run

### Step 1 — Clone the repo

**PowerShell / CMD:**
```powershell
git clone https://github.com/skysyaz/Attendance.git
cd Attendance
```

**macOS / Linux:**
```bash
git clone https://github.com/skysyaz/Attendance.git
cd Attendance
```

---

### Step 2 — Create a Python virtual environment

**PowerShell:**
```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
```

**CMD:**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate.bat
```

**macOS / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

> ✅ You should see `(venv)` at the start of your terminal prompt.

> ⚠️ **Windows PowerShell — Execution Policy Error?**  
> If you get `cannot be loaded because running scripts is disabled`, run this once:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

---

### Step 3 — Install Python dependencies

**PowerShell / CMD / macOS / Linux (same command):**
```bash
pip install -r requirements.txt
```

---

### Step 4 — Create `.env` file

Create a file called `.env` inside the `backend/` folder.

**PowerShell:**
```powershell
New-Item -Path .env -ItemType File
notepad .env
```

**CMD:**
```cmd
copy NUL .env
notepad .env
```

**macOS / Linux:**
```bash
nano .env
# or: code .env
```

Paste this content into the file:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=attendo
JWT_SECRET=change-this-to-a-long-random-secret
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=admin123
```

> 💡 Generate a secure `JWT_SECRET`:
>
> **PowerShell / CMD:**
> ```powershell
> python -c "import secrets; print(secrets.token_hex(32))"
> ```
>
> **macOS / Linux:**
> ```bash
> python3 -c "import secrets; print(secrets.token_hex(32))"
> ```

---

### Step 5 — Start MongoDB

**Windows (PowerShell / CMD):**
```powershell
# Option A — if installed as a Windows Service (default installer):
net start MongoDB

# Option B — run manually:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
```
> If `C:\data\db` doesn't exist, create it first:
> ```powershell
> mkdir C:\data\db
> ```

**macOS (Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

Verify MongoDB is running:

**PowerShell / CMD / macOS / Linux:**
```bash
mongosh --eval "db.runCommand({ ping: 1 })"
# Expected output: { ok: 1 }
```

---

### Step 6 — Start the backend server

**PowerShell / CMD:**
```powershell
# Make sure you're in backend\ with venv active
uvicorn server:app --reload --port 8001
```

**macOS / Linux:**
```bash
uvicorn server:app --reload --port 8001
```

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
INFO:     Seeded admin user: admin@company.com
INFO:     Seeded sample offices
```

---

### Step 7 — Verify backend works

Open your browser:
- **Swagger API docs:** http://localhost:8001/docs
- **Health check:** http://localhost:8001/api/health → `{"status": "ok"}`
- **Root:** http://localhost:8001/api/

---

## 4. Frontend Setup & Run

### Step 1 — Install Node dependencies

**PowerShell / CMD:**
```powershell
cd frontend
yarn install
```

**macOS / Linux:**
```bash
cd frontend
yarn install
```

---

### Step 2 — Create `.env` file

Create a file called `.env` inside the `frontend/` folder.

**PowerShell:**
```powershell
New-Item -Path .env -ItemType File
notepad .env
```

**CMD:**
```cmd
copy NUL .env
notepad .env
```

**macOS / Linux:**
```bash
nano .env
```

Paste this content:
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

> ⚠️ **If testing on a physical phone**, replace `localhost` with your laptop's local network IP:
> ```env
> EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8001
> ```
>
> Find your local IP:
>
> **PowerShell:**
> ```powershell
> ipconfig
> # Look for: IPv4 Address . . . . : 192.168.x.x
> ```
>
> **CMD:**
> ```cmd
> ipconfig
> ```
>
> **macOS:**
> ```bash
> ipconfig getifaddr en0
> ```
>
> **Linux:**
> ```bash
> hostname -I | awk '{print $1}'
> ```

---

### Step 3 — Start the Expo dev server

**PowerShell / CMD:**
```powershell
yarn start
```

**macOS / Linux:**
```bash
yarn start
```

A **QR code** will appear in the terminal.

---

### Step 4 — Open the app

**Option A — Physical Android phone (recommended):**
1. Install **Expo Go** from Google Play Store
2. Open Expo Go → tap **Scan QR code**
3. Scan the QR code shown in your terminal

**Option B — Physical iPhone:**
1. Install **Expo Go** from App Store
2. Open the iPhone Camera app → scan the QR code
3. Tap the Expo Go banner that appears

**Option C — Android emulator (requires Android Studio):**
```powershell
# Press 'a' in the Expo terminal, or:
yarn android
```

**Option D — iOS simulator (macOS only, requires Xcode):**
```bash
# Press 'i' in the Expo terminal, or:
yarn ios
```

**Option E — Web browser:**
```powershell
yarn web
# Opens at http://localhost:8081
```

---

## 5. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URL` | ✅ | — | MongoDB connection string |
| `DB_NAME` | ✅ | — | Database name |
| `JWT_SECRET` | ✅ | — | Secret for JWT signing — keep this private |
| `ADMIN_EMAIL` | ❌ | `admin@company.com` | Seeded admin email |
| `ADMIN_PASSWORD` | ❌ | `admin123` | Seeded admin password |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXPO_PUBLIC_BACKEND_URL` | ✅ | `http://localhost:8001` | Backend API base URL |

---

## 6. Running Tests

### Backend integration tests

The backend must be **running** before you run tests.

**Terminal 1 — start backend:**

**PowerShell:**
```powershell
cd backend
venv\Scripts\Activate.ps1
uvicorn server:app --reload --port 8001
```

**CMD:**
```cmd
cd backend
venv\Scripts\activate.bat
uvicorn server:app --reload --port 8001
```

**macOS / Linux:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --reload --port 8001
```

---

**Terminal 2 — run tests:**

**PowerShell:**
```powershell
cd backend
venv\Scripts\Activate.ps1
pip install pytest requests

$env:EXPO_PUBLIC_BACKEND_URL = "http://localhost:8001"
pytest tests/ -v
```

**CMD:**
```cmd
cd backend
venv\Scripts\activate.bat
pip install pytest requests

set EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
pytest tests/ -v
```

**macOS / Linux:**
```bash
cd backend
source venv/bin/activate
pip install pytest requests

EXPO_PUBLIC_BACKEND_URL=http://localhost:8001 pytest tests/ -v
```

Expected output:
```
tests/test_attendance_api.py::TestAuth::test_register_duplicate_rejected PASSED
tests/test_attendance_api.py::TestAuth::test_login_invalid PASSED
tests/test_attendance_api.py::TestAuth::test_me_requires_auth PASSED
tests/test_attendance_api.py::TestAuth::test_me_ok PASSED
tests/test_attendance_api.py::TestOfficesRBAC::test_list_offices_auth_required PASSED
tests/test_attendance_api.py::TestOfficesRBAC::test_list_offices_staff PASSED
tests/test_attendance_api.py::TestOfficesRBAC::test_create_office_staff_forbidden PASSED
tests/test_attendance_api.py::TestOfficesRBAC::test_delete_office_staff_forbidden PASSED
tests/test_attendance_api.py::TestOfficesRBAC::test_admin_create_and_delete_office PASSED
tests/test_attendance_api.py::TestAdminAccess::test_admin_stats_forbidden_for_staff PASSED
tests/test_attendance_api.py::TestAdminAccess::test_attendance_all_forbidden_for_staff PASSED
tests/test_attendance_api.py::TestAdminAccess::test_admin_stats_ok PASSED
tests/test_attendance_api.py::TestAdminAccess::test_attendance_all_ok PASSED
tests/test_attendance_api.py::TestAttendanceFlow::test_full_checkin_checkout_flow PASSED
tests/test_attendance_api.py::TestAttendanceFlow::test_checkout_without_active_fails PASSED

15 passed in X.XXs
```

---

### Frontend TypeScript check

**PowerShell / CMD:**
```powershell
cd frontend
npx tsc --noEmit
```

**macOS / Linux:**
```bash
cd frontend
npx tsc --noEmit
```
> No output = ✅ no errors.

---

### Frontend lint

**PowerShell / CMD / macOS / Linux:**
```powershell
cd frontend
yarn lint
```
> Should print `Done` with no errors or warnings.

---

### Manual QA Checklist

Run through these after starting both backend and frontend:

| # | Test | Steps | Expected Result |
|---|------|-------|----------------|
| 1 | Admin login | Email: `admin@company.com` · Password: `admin123` | Admin dashboard opens |
| 2 | Staff register | Tap "Create account" · fill form | Staff dashboard opens |
| 3 | Staff login | Login with registered account | Staff dashboard opens |
| 4 | Check-in | Staff dashboard → tap **Check in now** | Status shows CHECKED IN · time recorded |
| 5 | Duplicate check-in | Tap check-in again same day | Error: "already checked in today" |
| 6 | Check-out | Tap **Check out** | Hours worked displayed |
| 7 | Second check-out | Tap check-out again | Error: "no active check-in" |
| 8 | History | Tap HISTORY tab | List of past attendance records |
| 9 | Map | Tap MAP tab | Green/red pins at check-in locations |
| 10 | Admin stats | Login as admin → OVERVIEW tab | Active now, checked-in today counts |
| 11 | Admin attendance list | Scroll down on OVERVIEW | Today's staff rows visible |
| 12 | Add office | Admin → OFFICES tab → fill form → Add | New office appears in list |
| 13 | Delete office | OFFICES → trash icon → confirm | Office removed |
| 14 | Logout | PROFILE tab → Sign out | Returns to login screen |

---

## 7. Build APK (Android)

### Method A — EAS Cloud Build ✅ Recommended

No Android SDK or Android Studio required. The APK is built on Expo's cloud servers.

#### One-time setup (run once per project):

**PowerShell / CMD:**
```powershell
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account (create free at expo.dev)
eas login

# Link project to your Expo account
cd frontend
eas build:configure
```

**macOS / Linux:**
```bash
npm install -g eas-cli
eas login
cd frontend
eas build:configure
```

---

#### Build preview APK:

**PowerShell:**
```powershell
cd frontend
$env:EXPO_PUBLIC_BACKEND_URL = "http://YOUR_BACKEND_IP:8001"
eas build --platform android --profile preview
```

**CMD:**
```cmd
cd frontend
set EXPO_PUBLIC_BACKEND_URL=http://YOUR_BACKEND_IP:8001
eas build --platform android --profile preview
```

**macOS / Linux:**
```bash
cd frontend
EXPO_PUBLIC_BACKEND_URL=http://YOUR_BACKEND_IP:8001 \
  eas build --platform android --profile preview
```

> ⚠️ Replace `YOUR_BACKEND_IP` with your laptop's local network IP (see Section 4 Step 2).  
> The phone needs to be able to reach that IP — both devices must be on the same Wi-Fi.

When the build finishes, EAS gives you a **download link** for the `.apk` file.  
Install it on your Android phone by opening the link on the phone.

---

#### Other build profiles:

**PowerShell / CMD / macOS / Linux:**
```powershell
# Development build (includes dev menu)
eas build --platform android --profile development

# Production AAB (for Google Play Store)
eas build --platform android --profile production

# iOS IPA (requires Apple Developer account $99/yr)
eas build --platform ios --profile production
```

---

### Method B — Local Build (requires Android Studio)

#### Setup:

1. Install [Android Studio](https://developer.android.com/studio)
2. Open Android Studio → **SDK Manager** → install **Android SDK API 34**
3. Set environment variables:

**PowerShell (add to your `$PROFILE`):**
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\platform-tools"
```

**CMD (add to System Environment Variables via Control Panel):**
```
ANDROID_HOME = C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
PATH += %ANDROID_HOME%\emulator;%ANDROID_HOME%\platform-tools
```

**macOS / Linux:**
```bash
# Add to ~/.zshrc or ~/.bashrc:
export ANDROID_HOME=$HOME/Library/Android/sdk      # macOS
export ANDROID_HOME=$HOME/Android/Sdk              # Linux
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### Build:

**PowerShell / CMD:**
```powershell
cd frontend
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleDebug
```

**macOS / Linux:**
```bash
cd frontend
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
```

APK output location:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 8. Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@company.com` | `admin123` |
| Staff | Register via the app | (you choose) |

> The admin account is seeded automatically on first backend startup.  
> To change admin credentials, update `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` and restart.

---

## 9. Troubleshooting

### ❌ Backend: `KeyError: 'MONGO_URL'`
You haven't created `backend/.env`. Follow [Step 4](#step-4--create-env-file).

---

### ❌ Backend: MongoDB connection refused
```
ServerSelectionTimeoutError: localhost:27017
```
MongoDB is not running.

**Windows:**
```powershell
net start MongoDB
```
**macOS:**
```bash
brew services start mongodb-community
```
**Linux:**
```bash
sudo systemctl start mongod
```

---

### ❌ PowerShell: `cannot be loaded, running scripts is disabled`
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### ❌ App on phone: `Network Error` / can't connect to backend
You're using `localhost` in `EXPO_PUBLIC_BACKEND_URL` — phones can't reach your laptop's localhost.

**Fix:**

**PowerShell / CMD:**
```powershell
ipconfig
# Find: IPv4 Address . . . . : 192.168.x.x
```

Update `frontend/.env`:
```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.x.x:8001
```

Also allow port 8001 through Windows Firewall:
```powershell
# Run as Administrator:
netsh advfirewall firewall add rule name="Attendo Backend" dir=in action=allow protocol=TCP localport=8001
```

---

### ❌ Expo QR code won't scan
- Make sure phone and laptop are on the **same Wi-Fi**
- Try tunnel mode:
  ```powershell
  yarn start --tunnel
  ```

---

### ❌ EAS build fails: `project not configured`
```powershell
cd frontend
eas build:configure
```

---

### ❌ `yarn` not found
```powershell
npm install -g yarn
```

---

### ❌ `python` not found (Windows)
During Python install, make sure you tick **"Add Python to PATH"**.  
Or run:
```powershell
python3 --version   # try python3
py --version        # try py launcher
```
Use whichever works on your machine.

---

*Last updated: 2026-04-28*
