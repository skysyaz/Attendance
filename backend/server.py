from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr


# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    employee_id: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    employee_id: Optional[str] = None
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class OfficeCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float


class Office(BaseModel):
    id: str
    name: str
    address: str
    latitude: float
    longitude: float
    created_at: datetime


class CheckInRequest(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    office_id: Optional[str] = None
    notes: Optional[str] = None
    client_date: Optional[str] = None  # YYYY-MM-DD in user's local tz


class CheckOutRequest(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    notes: Optional[str] = None
    client_date: Optional[str] = None


class Attendance(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    check_in_time: datetime
    check_in_lat: float
    check_in_lng: float
    check_in_address: Optional[str] = None
    check_out_time: Optional[datetime] = None
    check_out_lat: Optional[float] = None
    check_out_lng: Optional[float] = None
    check_out_address: Optional[str] = None
    office_id: Optional[str] = None
    office_name: Optional[str] = None
    notes: Optional[str] = None
    date: str  # YYYY-MM-DD
    hours_worked: Optional[float] = None


# ---------- Auth helpers ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def user_to_out(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "employee_id": user.get("employee_id"),
        "created_at": user["created_at"],
    }


# ---------- Auth endpoints ----------
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(body: UserCreate):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "employee_id": body.employee_id,
        "role": "staff",
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_doc["id"], email, "staff")
    return {"token": token, "user": user_to_out(user_doc)}


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(body: UserLogin):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email, user["role"])
    return {"token": token, "user": user_to_out(user)}


@api_router.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return user_to_out(user)


# ---------- Office endpoints ----------
@api_router.get("/offices", response_model=List[Office])
async def list_offices(user: dict = Depends(get_current_user)):
    offices = await db.offices.find({}, {"_id": 0}).to_list(1000)
    return offices


@api_router.post("/offices", response_model=Office)
async def create_office(body: OfficeCreate, user: dict = Depends(require_admin)):
    doc = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "address": body.address,
        "latitude": body.latitude,
        "longitude": body.longitude,
        "created_at": datetime.now(timezone.utc),
    }
    await db.offices.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/offices/{office_id}")
async def delete_office(office_id: str, user: dict = Depends(require_admin)):
    result = await db.offices.delete_one({"id": office_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Office not found")
    return {"success": True}


# ---------- Attendance endpoints ----------
@api_router.post("/attendance/check-in", response_model=Attendance)
async def check_in(body: CheckInRequest, user: dict = Depends(get_current_user)):
    # Prefer client's local date so staff + admin in the same office agree on "today"
    today = body.client_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    # Prevent duplicate active check-in
    active = await db.attendance.find_one(
        {"user_id": user["id"], "date": today, "check_out_time": None},
        {"_id": 0},
    )
    if active:
        raise HTTPException(status_code=400, detail="You are already checked in today")

    office_name = None
    if body.office_id:
        office = await db.offices.find_one({"id": body.office_id}, {"_id": 0})
        if office:
            office_name = office["name"]

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["name"],
        "user_email": user["email"],
        "check_in_time": datetime.now(timezone.utc),
        "check_in_lat": body.latitude,
        "check_in_lng": body.longitude,
        "check_in_address": body.address,
        "check_out_time": None,
        "check_out_lat": None,
        "check_out_lng": None,
        "check_out_address": None,
        "office_id": body.office_id,
        "office_name": office_name,
        "notes": body.notes,
        "date": today,
        "hours_worked": None,
    }
    await db.attendance.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.post("/attendance/check-out", response_model=Attendance)
async def check_out(body: CheckOutRequest, user: dict = Depends(get_current_user)):
    today = body.client_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    active = await db.attendance.find_one(
        {"user_id": user["id"], "date": today, "check_out_time": None}
    )
    if not active:
        raise HTTPException(status_code=400, detail="No active check-in found for today")

    check_out_time = datetime.now(timezone.utc)
    check_in_time = active["check_in_time"]
    if check_in_time.tzinfo is None:
        check_in_time = check_in_time.replace(tzinfo=timezone.utc)
    hours = round((check_out_time - check_in_time).total_seconds() / 3600, 2)

    await db.attendance.update_one(
        {"id": active["id"]},
        {
            "$set": {
                "check_out_time": check_out_time,
                "check_out_lat": body.latitude,
                "check_out_lng": body.longitude,
                "check_out_address": body.address,
                "hours_worked": hours,
            }
        },
    )
    updated = await db.attendance.find_one({"id": active["id"]}, {"_id": 0})
    return updated


@api_router.get("/attendance/today")
async def attendance_today(client_date: Optional[str] = None, user: dict = Depends(get_current_user)):
    today = client_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    record = await db.attendance.find_one(
        {"user_id": user["id"], "date": today}, {"_id": 0}
    )
    return {"record": record}


@api_router.get("/attendance/me", response_model=List[Attendance])
async def attendance_me(user: dict = Depends(get_current_user)):
    records = (
        await db.attendance.find({"user_id": user["id"]}, {"_id": 0})
        .sort("check_in_time", -1)
        .to_list(500)
    )
    return records


@api_router.get("/attendance/all", response_model=List[Attendance])
async def attendance_all(
    date: Optional[str] = None,
    today_only: bool = False,
    user: dict = Depends(require_admin),
):
    query = {}
    if today_only:
        query["date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    elif date:
        query["date"] = date
    records = (
        await db.attendance.find(query, {"_id": 0})
        .sort("check_in_time", -1)
        .to_list(1000)
    )
    return records


@api_router.get("/admin/stats")
async def admin_stats(client_date: Optional[str] = None, user: dict = Depends(require_admin)):
    today = client_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    total_staff = await db.users.count_documents({"role": "staff"})
    checked_in_today = await db.attendance.count_documents({"date": today})
    active_now = await db.attendance.count_documents({"date": today, "check_out_time": None})
    total_offices = await db.offices.count_documents({})
    return {
        "total_staff": total_staff,
        "checked_in_today": checked_in_today,
        "active_now": active_now,
        "total_offices": total_offices,
    }


@api_router.get("/admin/staff")
async def list_staff(user: dict = Depends(require_admin)):
    staff = await db.users.find(
        {"role": "staff"}, {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    return staff


@api_router.get("/")
async def root():
    return {"message": "Staff Attendance API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.attendance.create_index([("user_id", 1), ("date", 1)])
    await db.offices.create_index("id", unique=True)

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@company.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one(
            {
                "id": str(uuid.uuid4()),
                "email": admin_email,
                "password_hash": hash_password(admin_password),
                "name": "Admin",
                "role": "admin",
                "employee_id": "ADMIN001",
                "created_at": datetime.now(timezone.utc),
            }
        )
        logger.info("Seeded admin user: %s", admin_email)

    # Seed sample offices if none
    count = await db.offices.count_documents({})
    if count == 0:
        await db.offices.insert_many(
            [
                {
                    "id": str(uuid.uuid4()),
                    "name": "HQ - San Francisco",
                    "address": "100 Market Street, San Francisco, CA",
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "created_at": datetime.now(timezone.utc),
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Office - New York",
                    "address": "350 5th Ave, New York, NY",
                    "latitude": 40.7484,
                    "longitude": -73.9857,
                    "created_at": datetime.now(timezone.utc),
                },
            ]
        )
        logger.info("Seeded sample offices")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
