# Attendo Refactor Report

## Summary

Full refactor and bug-fix pass on both backend and frontend. All TypeScript errors resolved, lint clean (0 errors, 0 warnings). EAS CLI installed and ready for APK build.

---

## Backend Changes (`backend/server.py`)

| # | Fix | Details |
|---|-----|---------|
| 1 | **Deprecated `@app.on_event` removed** | Replaced `@app.on_event("startup")` and `@app.on_event("shutdown")` with the modern `@asynccontextmanager lifespan()` pattern required by FastAPI 0.110+ |
| 2 | **CORS middleware moved** | Was registered AFTER `app.include_router()` — now registered BEFORE. Ensures CORS headers apply to all routes correctly |
| 3 | **Date index added** | Added `await db.attendance.create_index("date")` for faster date-based queries in admin views |
| 4 | **Negative `hours_worked` guard** | `hours = max(0.0, round(...))` prevents negative values if clocks drift or data is inconsistent |
| 5 | **`get_current_user` catch-all** | Added `except Exception` block returning 401 — prevents a 500 error on unexpected JWT decode failures |
| 6 | **`/api/health` endpoint** | Added `GET /api/health → {"status": "ok"}` for load balancer / uptime check compatibility |
| 7 | **Unused `Field` import removed** | Cleaned up `from pydantic import BaseModel, Field, EmailStr` → removed unused `Field` |
| 8 | **Logger initialised early** | Moved `logging.basicConfig` to top-level so it's available during startup seeding |

---

## Frontend Changes

### `app.json`
| Fix | Before | After |
|-----|--------|-------|
| `slug` | `"frontend"` | `"attendo"` |
| `scheme` | `"frontend"` | `"attendo"` |
| Splash image | `splash-icon.png` (missing file → build failure) | `splash-image.png` (correct file) |
| Android `package` | missing | `"com.attendo.app"` |
| iOS `bundleIdentifier` | missing | `"com.attendo.app"` |

### TypeScript `Record` type conflicts
Files affected: `(staff)/dashboard.tsx`, `(staff)/history.tsx`, `(staff)/map.tsx`, `(admin)/dashboard.tsx`
- Renamed local `type Record` → `type AttendanceRecord` everywhere
- Fixes shadowing of the built-in TypeScript `Record<K,V>` utility type

### `src/api.ts`
- `BASE_URL` now falls back to `"http://localhost:8001"` if `EXPO_PUBLIC_BACKEND_URL` is unset (was `undefined`, causing runtime crashes in dev)

### `(staff)/dashboard.tsx`
- Added `useRef` import
- Fixed `useCallback` missing deps: replaced `selectedOffice` dependency with a `hasSetOffice` ref — eliminates the stale closure / infinite re-render risk
- Fixed `useEffect` deps array to include `load`
- Silenced catch variable warning with bare `catch {}`

### `(staff)/history.tsx`
- Removed unused `radius` import
- Fixed `useEffect` deps to include `load`

### `(staff)/map.tsx`
- Removed unused `ScrollView` and `Feather` imports
- Fixed `iframe` TypeScript error with `// @ts-ignore` comment and `as any` style cast

### `(admin)/dashboard.tsx`
- Added `error` state + retry UI — load failures are now surfaced to the user instead of silently swallowed
- Added `TouchableOpacity` import
- Fixed `useEffect` deps to include `load`

### `(admin)/offices.tsx`
- Fixed `useEffect` deps to include `load`

### `app/index.tsx`
- Fixed `useEffect` deps to include `router`

### `app/login.tsx`
- Removed unused `Alert` import

### `(staff)/profile.tsx` + `(admin)/profile.tsx`
- **Extracted shared `ProfileScreen` component** at `src/components/ProfileScreen.tsx`
- Both profile screens now delegate to the shared component with props for avatar colour, info rows, role pill label, and testId
- Eliminated ~120 lines of duplicated code

---

## New Files
| File | Purpose |
|------|---------|
| `frontend/eas.json` | EAS Build config — `development`, `preview` (APK), and `production` (AAB) profiles |
| `frontend/src/components/ProfileScreen.tsx` | Shared profile screen component used by both staff and admin |

---

## Test Results

### Backend — Static Analysis
```
✅ python3 -c "import ast; ast.parse(...)" → Syntax OK
```
Live integration tests (`tests/test_attendance_api.py`) require a running MongoDB + deployed backend URL. To run them locally:
```bash
cd backend
# With MongoDB running on localhost:27017
MONGO_URL=mongodb://localhost:27017 DB_NAME=attendo_test JWT_SECRET=testsecret \
  uvicorn server:app --port 8001 &
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001 pytest tests/ -v
```

### Frontend — TypeScript
```
✅ npx tsc --noEmit → 0 errors
```

### Frontend — Lint
```
✅ yarn lint → 0 errors, 0 warnings
```

---

## APK Build

**EAS CLI installed:** `eas-cli/18.8.1`

### To build a preview APK:
```bash
cd /root/.openclaw/workspace/Attendance/frontend

# 1. Login to Expo account (one-time)
eas login

# 2. Set your backend URL
export EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com

# 3. Build APK (cloud build via EAS)
eas build --platform android --profile preview

# Output: .apk download link when complete
```

### For local APK (requires Android SDK):
```bash
# Export the JS bundle
npx expo export --platform android

# Then use Gradle to assemble (requires Android SDK at $ANDROID_HOME)
cd android && ./gradlew assembleRelease
```

### What you need for EAS build:
- [ ] Expo account (free at expo.dev)
- [ ] `EXPO_PUBLIC_BACKEND_URL` pointing to your deployed backend
- [ ] Run `eas login` + `eas build:configure` once per project

---

## Remaining Manual Steps

1. **Deploy backend** — set `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` env vars
2. **Update `EXPO_PUBLIC_BACKEND_URL`** in your Expo project secrets or `.env` before building
3. **`eas login`** — needs your expo.dev credentials
4. **Run `eas build:configure`** once to link the project to your Expo account
