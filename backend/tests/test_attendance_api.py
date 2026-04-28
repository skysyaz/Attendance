"""Backend API tests for Staff Attendance app."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@company.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    return data["token"]


@pytest.fixture(scope="module")
def staff():
    email = f"test_staff_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "staff123", "name": "TEST Staff"
    })
    assert r.status_code == 200, f"register failed: {r.text}"
    data = r.json()
    assert data["user"]["role"] == "staff"
    return {"email": email, "password": "staff123", "token": data["token"], "id": data["user"]["id"]}


# ---------- Auth ----------
class TestAuth:
    def test_register_duplicate_rejected(self, staff):
        r = requests.post(f"{API}/auth/register", json={
            "email": staff["email"], "password": "x", "name": "x"
        })
        assert r.status_code == 400

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_ok(self, staff):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {staff['token']}"})
        assert r.status_code == 200
        assert r.json()["email"] == staff["email"]
        assert r.json()["role"] == "staff"


# ---------- Offices / RBAC ----------
class TestOfficesRBAC:
    def test_list_offices_auth_required(self):
        r = requests.get(f"{API}/offices")
        assert r.status_code == 401

    def test_list_offices_staff(self, staff):
        r = requests.get(f"{API}/offices", headers={"Authorization": f"Bearer {staff['token']}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_office_staff_forbidden(self, staff):
        r = requests.post(f"{API}/offices", json={
            "name": "X", "address": "x", "latitude": 1.0, "longitude": 2.0
        }, headers={"Authorization": f"Bearer {staff['token']}"})
        assert r.status_code == 403

    def test_delete_office_staff_forbidden(self, staff):
        r = requests.delete(f"{API}/offices/fake-id",
                            headers={"Authorization": f"Bearer {staff['token']}"})
        assert r.status_code == 403

    def test_admin_create_and_delete_office(self, admin_token):
        r = requests.post(f"{API}/offices", json={
            "name": "TEST Office", "address": "TEST addr", "latitude": 10.0, "longitude": 20.0
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        office_id = r.json()["id"]
        assert r.json()["name"] == "TEST Office"
        # Verify GET
        r2 = requests.get(f"{API}/offices", headers={"Authorization": f"Bearer {admin_token}"})
        assert any(o["id"] == office_id for o in r2.json())
        # Delete
        r3 = requests.delete(f"{API}/offices/{office_id}",
                             headers={"Authorization": f"Bearer {admin_token}"})
        assert r3.status_code == 200
        # Verify gone
        r4 = requests.delete(f"{API}/offices/{office_id}",
                             headers={"Authorization": f"Bearer {admin_token}"})
        assert r4.status_code == 404


# ---------- Admin endpoints ----------
class TestAdminAccess:
    def test_admin_stats_forbidden_for_staff(self, staff):
        r = requests.get(f"{API}/admin/stats", headers={"Authorization": f"Bearer {staff['token']}"})
        assert r.status_code == 403

    def test_attendance_all_forbidden_for_staff(self, staff):
        r = requests.get(f"{API}/attendance/all", headers={"Authorization": f"Bearer {staff['token']}"})
        assert r.status_code == 403

    def test_admin_stats_ok(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        d = r.json()
        for k in ["total_staff", "checked_in_today", "active_now", "total_offices"]:
            assert k in d
            assert isinstance(d[k], int)

    def test_attendance_all_ok(self, admin_token):
        r = requests.get(f"{API}/attendance/all", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- Attendance flow ----------
class TestAttendanceFlow:
    def test_full_checkin_checkout_flow(self, staff):
        h = {"Authorization": f"Bearer {staff['token']}"}
        # Check no record initially (for fresh user)
        r = requests.get(f"{API}/attendance/today", headers=h)
        assert r.status_code == 200
        assert r.json().get("record") is None

        # Check-in
        r = requests.post(f"{API}/attendance/check-in", json={
            "latitude": 37.7749, "longitude": -122.4194, "address": "SF"
        }, headers=h)
        assert r.status_code == 200, r.text
        rec = r.json()
        assert rec["user_id"] == staff["id"]
        assert rec["check_in_lat"] == 37.7749
        assert rec["check_out_time"] is None

        # Duplicate check-in rejected
        r = requests.post(f"{API}/attendance/check-in", json={
            "latitude": 1.0, "longitude": 2.0
        }, headers=h)
        assert r.status_code == 400

        # GET today has record
        r = requests.get(f"{API}/attendance/today", headers=h)
        assert r.status_code == 200
        assert r.json()["record"] is not None
        assert r.json()["record"]["check_out_time"] is None

        # Check-out
        r = requests.post(f"{API}/attendance/check-out", json={
            "latitude": 37.7750, "longitude": -122.4195, "address": "SF out"
        }, headers=h)
        assert r.status_code == 200
        out = r.json()
        assert out["check_out_time"] is not None
        assert out["hours_worked"] is not None

        # Second check-out fails
        r = requests.post(f"{API}/attendance/check-out", json={
            "latitude": 1.0, "longitude": 2.0
        }, headers=h)
        assert r.status_code == 400

        # /attendance/me has record
        r = requests.get(f"{API}/attendance/me", headers=h)
        assert r.status_code == 200
        recs = r.json()
        assert len(recs) >= 1
        assert recs[0]["user_id"] == staff["id"]

    def test_checkout_without_active_fails(self):
        # Fresh user with no check-in
        email = f"test_staff_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "x", "name": "x"
        })
        token = r.json()["token"]
        r = requests.post(f"{API}/attendance/check-out", json={
            "latitude": 1.0, "longitude": 2.0
        }, headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 400
