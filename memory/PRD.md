# Staff Attendance App — PRD

## Overview
Mobile-first attendance tracking system with GPS location for staff check-in/check-out. Built with React Native (Expo), FastAPI, and MongoDB.

## User Roles
- **Staff**: Check-in/check-out with GPS, view own attendance history, see map of check-in locations.
- **Admin**: View all staff attendance records, manage office locations, see org-wide statistics.

## Key Features
- JWT email/password authentication with bcrypt password hashing
- GPS-based check-in/check-out (no geofence — records any coordinates)
- Multiple office locations supported; staff can select which office on check-in
- Reverse geocoded address attached to each check-in/check-out
- Attendance history list per staff + global list for admin
- Interactive map (Leaflet + OpenStreetMap via WebView) showing check-in/check-out pins
- Admin CRUD for offices with "use current location" helper
- Real-time org stats (active now, checked-in today, total staff, offices)

## Tech Stack
- Frontend: Expo SDK 54, expo-router, expo-location, react-native-webview, axios, date-fns
- Backend: FastAPI, motor (MongoDB), bcrypt, PyJWT
- Auth: JWT bearer tokens stored in AsyncStorage

## Default Credentials
- Admin: `admin@company.com` / `admin123`
- Staff: register via UI

## Business Enhancement
Admin dashboard gives real-time org visibility (active-now counter + today's roster) — turns attendance data into operations insight for managers to ping late staff or understand floor coverage instantly.
