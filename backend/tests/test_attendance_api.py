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


@pytest.fixture(scope="module")
def test_office_id(admin_token):
    """Create a test office and return its ID for update/delete tests."""
    r = requests.post(f"{API}/offices", json={
        "name": "TEST Update Office", "address": "123 Test St",
        "latitude": 10.0, "longitude": 20.0
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    return r.json()["id"]


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


# ---------- Office Update Tests ----------
class TestOfficeUpdate:
    def test_update_office_success(self, admin_token, test_office_id):
        """Update name, address, and coordinates of an existing office."""
        r = requests.put(f"{API}/offices/{test_office_id}", json={
            "name": "Updated Office", "address": "456 New Ave",
            "latitude": 30.0, "longitude": 40.0
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "Updated Office"
        assert data["address"] == "456 New Ave"
        assert data["latitude"] == 30.0
        assert data["longitude"] == 40.0
        assert "created_at" in data

    def test_update_office_partial_name_only(self, admin_token, test_office_id):
        """Update only the name, other fields stay unchanged."""
        # First get current state
        r = requests.get(f"{API}/offices", headers={"Authorization": f"Bearer {admin_token}"})
        offices = {o["id"]: o for o in r.json()}
        original = offices[test_office_id]

        r = requests.put(f"{API}/offices/{test_office_id}", json={
            "name": "Partially Updated",
            "address": original["address"],
            "latitude": original["latitude"],
            "longitude": original["longitude"],
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert r.json()["name"] == "Partially Updated"
        assert r.json()["latitude"] == original["latitude"]

    def test_update_office_not_found(self, admin_token):
        """Update a non-existent office returns 404."""
        r = requests.put(f"{API}/offices/non-existent-id", json={
            "name": "X", "address": "X", "latitude": 1.0, "longitude": 2.0
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 404

    def test_update_office_staff_forbidden(self, staff, test_office_id):
        """Staff cannot update offices — expect 403."""
        r = requests.put(f"{API}/offices/{test_office_id}", json={
            "name": "X", "address": "X", "latitude": 1.0, "longitude": 2.0
        }, headers={"Authorization": f"Bearer {staff['token']}"})
        assert r.status_code == 403

    def test_update_office_unauthorized(self, test_office_id):
        """No auth token — expect 401."""
        r = requests.put(f"{API}/offices/{test_office_id}", json={
            "name": "X", "address": "X", "latitude": 1.0, "longitude": 2.0
        })
        assert r.status_code == 401

    def test_update_office_zero_coordinates(self, admin_token):
        """Latitude/longitude of 0 should be accepted."""
        # Create office with 0,0
        r = requests.post(f"{API}/offices", json={
            "name": "Zero Coords", "address": "Equator",
            "latitude": 0, "longitude": 0
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        oid = r.json()["id"]

        # Update with 0,0 again
        r = requests.put(f"{API}/offices/{oid}", json={
            "name": "Zero Updated", "address": "Equator Line",
            "latitude": 0, "longitude": 0
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert r.json()["latitude"] == 0.0
        assert r.json()["longitude"] == 0.0

    def test_update_office_keeps_id(self, admin_token, test_office_id):
        """Update does not change the office ID."""
        r = requests.put(f"{API}/offices/{test_office_id}", json={
            "name": "ID Check", "address": "X", "latitude": 5.0, "longitude": 5.0
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert r.json()["id"] == test_office_id

    def test_update_office_validation_error(self, admin_token, test_office_id):
        """Missing required fields should return 422."""
        # Missing name
        r = requests.put(f"{API}/offices/{test_office_id}", json={
            "address": "X", "latitude": 1.0, "longitude": 2.0
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 422

        # Invalid latitude type
        r = requests.put(f"{API}/offices/{test_office_id}", json={
            "name": "X", "address": "X", "latitude": "not-a-number", "longitude": 2.0
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 422


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

    def test_attendance_all_today_only(self, admin_token):
        """today_only filter returns only today's records."""
        r = requests.get(f"{API}/attendance/all", params={"today_only": True},
                         headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_attendance_all_by_date(self, admin_token):
        """Filter by specific date returns records for that date."""
        r = requests.get(f"{API}/attendance/all", params={"date": "2020-01-01"},
                         headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        # Should be empty list since no records from 2020
        assert isinstance(r.json(), list)
        assert len(r.json()) == 0

    def test_admin_list_staff(self, admin_token):
        r = requests.get(f"{API}/admin/staff", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        for s in r.json():
            assert "password_hash" not in s


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

    def test_checkin_with_office_id(self, staff, test_office_id):
        """Check-in with a valid office_id should set office_name."""
        h = {"Authorization": f"Bearer {staff['token']}"}
        r = requests.post(f"{API}/attendance/check-in", json={
            "latitude": 10.0, "longitude": 20.0,
            "office_id": test_office_id, "address": "Office check-in"
        }, headers=h)
        assert r.status_code == 200
        assert r.json()["office_id"] == test_office_id
        assert r.json()["office_name"] is not None

        # Check-out to cleanup
        r = requests.post(f"{API}/attendance/check-out", json={
            "latitude": 10.0, "longitude": 20.0
        }, headers=h)
        assert r.status_code == 200

    def test_checkin_with_invalid_office_id(self, staff):
        """Check-in with a non-existent office_id should still succeed but have no office_name."""
        h = {"Authorization": f"Bearer {staff['token']}"}
        r = requests.post(f"{API}/attendance/check-in", json={
            "latitude": 10.0, "longitude": 20.0,
            "office_id": "fake-office-id", "address": "Test"
        }, headers=h)
        assert r.status_code == 200
        assert r.json()["office_id"] == "fake-office-id"
        assert r.json()["office_name"] is None

        # Check-out to cleanup
        r = requests.post(f"{API}/attendance/check-out", json={
            "latitude": 10.0, "longitude": 20.0
        }, headers=h)
        assert r.status_code == 200


# ---------- Health ----------
class TestHealth:
    def test_health_endpoint(self):
        r = requests.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_root_endpoint(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        assert "message" in r.json()
