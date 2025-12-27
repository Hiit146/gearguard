from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from enum import Enum




ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'gearguard-super-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI(title="GearGuard API", version="1.0.0")

from fastapi.middleware.cors import CORSMiddleware

CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # okay if allow_credentials=False
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# =============================================================================
# ENUMS
# =============================================================================
class UserRole(str, Enum):
    MANAGER = "manager"
    TECHNICIAN = "technician"
    USER = "user"

class RequestType(str, Enum):
    CORRECTIVE = "corrective"
    PREVENTIVE = "preventive"

class RequestStage(str, Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    REPAIRED = "repaired"
    SCRAP = "scrap"

# =============================================================================
# MODELS
# =============================================================================
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.USER
    avatar: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.USER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    team_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# Team Models
class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    member_ids: List[str] = []

class Team(TeamBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_ids: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TeamWithMembers(Team):
    members: List[dict] = []

# Equipment Models
class EquipmentBase(BaseModel):
    name: str
    serial_number: str
    location: str
    department: str
    category: str
    employee_owner: Optional[str] = None
    purchase_date: Optional[str] = None
    warranty_expiry: Optional[str] = None
    notes: Optional[str] = None

class EquipmentCreate(EquipmentBase):
    assigned_team_id: Optional[str] = None
    default_technician_id: Optional[str] = None

class Equipment(EquipmentBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    assigned_team_id: Optional[str] = None
    default_technician_id: Optional[str] = None
    is_usable: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EquipmentWithDetails(Equipment):
    team: Optional[dict] = None
    technician: Optional[dict] = None
    open_request_count: int = 0

# Maintenance Request Models
class RequestBase(BaseModel):
    subject: str
    description: Optional[str] = None
    request_type: RequestType = RequestType.CORRECTIVE
    scheduled_date: Optional[str] = None
    priority: str = "medium"

class RequestCreate(RequestBase):
    equipment_id: str

class MaintenanceRequest(RequestBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    equipment_id: str
    equipment_name: Optional[str] = None
    equipment_category: Optional[str] = None
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    assigned_technician_id: Optional[str] = None
    assigned_technician_name: Optional[str] = None
    assigned_technician_avatar: Optional[str] = None
    stage: RequestStage = RequestStage.NEW
    hours_spent: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class RequestUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[RequestStage] = None
    assigned_technician_id: Optional[str] = None
    hours_spent: Optional[float] = None
    scheduled_date: Optional[str] = None
    priority: Optional[str] = None

# =============================================================================
# HELPERS
# =============================================================================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = None) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# =============================================================================
# AUTH ROUTES
# =============================================================================
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        avatar=f"https://api.dicebear.com/7.x/initials/svg?seed={user_data.name}"
    )
    
    doc = user.model_dump()
    doc['password'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    token = create_access_token({"sub": user.id, "role": user.role})
    user_dict = {k: v for k, v in doc.items() if k not in ['password', '_id']}
    
    return TokenResponse(access_token=token, user=user_dict)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get('password', '')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user['id'], "role": user['role']})
    user_dict = {k: v for k, v in user.items() if k != 'password'}
    
    return TokenResponse(access_token=token, user=user_dict)

@api_router.get("/auth/me")
async def get_me(authorization: str = None):
    from fastapi import Header
    user = await get_current_user(authorization)
    return user

# =============================================================================
# USER ROUTES
# =============================================================================
@api_router.get("/users", response_model=List[dict])
async def get_users():
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.get("/users/technicians", response_model=List[dict])
async def get_technicians():
    users = await db.users.find(
        {"role": {"$in": ["technician", "manager"]}},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    return users

# =============================================================================
# TEAM ROUTES
# =============================================================================
@api_router.post("/teams", response_model=dict)
async def create_team(team_data: TeamCreate):
    team = Team(
        name=team_data.name,
        description=team_data.description,
        member_ids=team_data.member_ids
    )
    doc = team.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.teams.insert_one(doc)
    
    # Update users with team_id
    if team_data.member_ids:
        await db.users.update_many(
            {"id": {"$in": team_data.member_ids}},
            {"$set": {"team_id": team.id}}
        )
    
    return {k: v for k, v in doc.items() if k != '_id'}

@api_router.get("/teams", response_model=List[dict])
async def get_teams():
    teams = await db.teams.find({}, {"_id": 0}).to_list(1000)
    
    for team in teams:
        if team.get('member_ids'):
            members = await db.users.find(
                {"id": {"$in": team['member_ids']}},
                {"_id": 0, "password": 0}
            ).to_list(100)
            team['members'] = members
        else:
            team['members'] = []
    
    return teams

@api_router.get("/teams/{team_id}")
async def get_team(team_id: str):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.get('member_ids'):
        members = await db.users.find(
            {"id": {"$in": team['member_ids']}},
            {"_id": 0, "password": 0}
        ).to_list(100)
        team['members'] = members
    else:
        team['members'] = []
    
    return team

@api_router.put("/teams/{team_id}")
async def update_team(team_id: str, team_data: TeamCreate):
    existing = await db.teams.find_one({"id": team_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Remove old team association
    if existing.get('member_ids'):
        await db.users.update_many(
            {"id": {"$in": existing['member_ids']}},
            {"$unset": {"team_id": ""}}
        )
    
    update_data = team_data.model_dump()
    await db.teams.update_one({"id": team_id}, {"$set": update_data})
    
    # Add new team association
    if team_data.member_ids:
        await db.users.update_many(
            {"id": {"$in": team_data.member_ids}},
            {"$set": {"team_id": team_id}}
        )
    
    updated = await db.teams.find_one({"id": team_id}, {"_id": 0})
    return updated

@api_router.delete("/teams/{team_id}")
async def delete_team(team_id: str):
    result = await db.teams.delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    
    await db.users.update_many({"team_id": team_id}, {"$unset": {"team_id": ""}})
    return {"message": "Team deleted"}

# =============================================================================
# EQUIPMENT ROUTES
# =============================================================================
@api_router.post("/equipment", response_model=dict)
async def create_equipment(equipment_data: EquipmentCreate):
    equipment = Equipment(**equipment_data.model_dump())
    doc = equipment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.equipment.insert_one(doc)
    return {k: v for k, v in doc.items() if k != '_id'}

@api_router.get("/equipment", response_model=List[dict])
async def get_equipment():
    equipment_list = await db.equipment.find({}, {"_id": 0}).to_list(1000)
    
    for eq in equipment_list:
        # Get team info
        if eq.get('assigned_team_id'):
            team = await db.teams.find_one({"id": eq['assigned_team_id']}, {"_id": 0})
            eq['team'] = team
        
        # Get technician info
        if eq.get('default_technician_id'):
            tech = await db.users.find_one(
                {"id": eq['default_technician_id']},
                {"_id": 0, "password": 0}
            )
            eq['technician'] = tech
        
        # Get open request count
        count = await db.requests.count_documents({
            "equipment_id": eq['id'],
            "stage": {"$nin": ["repaired", "scrap"]}
        })
        eq['open_request_count'] = count
    
    return equipment_list

@api_router.get("/equipment/{equipment_id}")
async def get_equipment_item(equipment_id: str):
    eq = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    if eq.get('assigned_team_id'):
        team = await db.teams.find_one({"id": eq['assigned_team_id']}, {"_id": 0})
        eq['team'] = team
    
    if eq.get('default_technician_id'):
        tech = await db.users.find_one(
            {"id": eq['default_technician_id']},
            {"_id": 0, "password": 0}
        )
        eq['technician'] = tech
    
    count = await db.requests.count_documents({
        "equipment_id": eq['id'],
        "stage": {"$nin": ["repaired", "scrap"]}
    })
    eq['open_request_count'] = count
    
    return eq

@api_router.put("/equipment/{equipment_id}")
async def update_equipment(equipment_id: str, equipment_data: EquipmentCreate):
    existing = await db.equipment.find_one({"id": equipment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    update_data = equipment_data.model_dump()
    await db.equipment.update_one({"id": equipment_id}, {"$set": update_data})
    
    updated = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    return updated

@api_router.delete("/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str):
    result = await db.equipment.delete_one({"id": equipment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return {"message": "Equipment deleted"}

@api_router.get("/equipment/{equipment_id}/requests")
async def get_equipment_requests(equipment_id: str):
    requests = await db.requests.find(
        {"equipment_id": equipment_id},
        {"_id": 0}
    ).to_list(1000)
    return requests

# =============================================================================
# MAINTENANCE REQUEST ROUTES
# =============================================================================
@api_router.post("/requests", response_model=dict)
async def create_request(request_data: RequestCreate, authorization: str = None):
    # Get equipment info
    equipment = await db.equipment.find_one({"id": request_data.equipment_id}, {"_id": 0})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Auto-fill from equipment
    team_name = None
    if equipment.get('assigned_team_id'):
        team = await db.teams.find_one({"id": equipment['assigned_team_id']}, {"_id": 0})
        team_name = team.get('name') if team else None
    
    tech_name = None
    tech_avatar = None
    if equipment.get('default_technician_id'):
        tech = await db.users.find_one(
            {"id": equipment['default_technician_id']},
            {"_id": 0, "password": 0}
        )
        if tech:
            tech_name = tech.get('name')
            tech_avatar = tech.get('avatar')
    
    req = MaintenanceRequest(
        **request_data.model_dump(),
        equipment_name=equipment.get('name'),
        equipment_category=equipment.get('category'),
        team_id=equipment.get('assigned_team_id'),
        team_name=team_name,
        assigned_technician_id=equipment.get('default_technician_id'),
        assigned_technician_name=tech_name,
        assigned_technician_avatar=tech_avatar
    )
    
    doc = req.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.requests.insert_one(doc)
    return {k: v for k, v in doc.items() if k != '_id'}

@api_router.get("/requests", response_model=List[dict])
async def get_requests(stage: Optional[str] = None, request_type: Optional[str] = None):
    query = {}
    if stage:
        query['stage'] = stage
    if request_type:
        query['request_type'] = request_type
    
    requests = await db.requests.find(query, {"_id": 0}).to_list(1000)
    return requests

@api_router.get("/requests/calendar")
async def get_calendar_requests():
    """Get preventive maintenance requests for calendar view"""
    requests = await db.requests.find(
        {"request_type": "preventive"},
        {"_id": 0}
    ).to_list(1000)
    return requests

@api_router.get("/requests/{request_id}")
async def get_request(request_id: str):
    req = await db.requests.find_one({"id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req

@api_router.put("/requests/{request_id}")
async def update_request(request_id: str, update_data: RequestUpdate):
    existing = await db.requests.find_one({"id": request_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Request not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Handle scrap logic - mark equipment as unusable
    if update_data.stage == RequestStage.SCRAP:
        await db.equipment.update_one(
            {"id": existing['equipment_id']},
            {"$set": {"is_usable": False}}
        )
    
    # If assigning technician, get their info
    if update_data.assigned_technician_id:
        tech = await db.users.find_one(
            {"id": update_data.assigned_technician_id},
            {"_id": 0, "password": 0}
        )
        if tech:
            update_dict['assigned_technician_name'] = tech.get('name')
            update_dict['assigned_technician_avatar'] = tech.get('avatar')
    
    await db.requests.update_one({"id": request_id}, {"$set": update_dict})
    
    updated = await db.requests.find_one({"id": request_id}, {"_id": 0})
    return updated

@api_router.patch("/requests/{request_id}/stage")
async def update_request_stage(request_id: str, stage: RequestStage):
    existing = await db.requests.find_one({"id": request_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Request not found")
    
    update_dict = {
        'stage': stage,
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    
    # Handle scrap logic
    if stage == RequestStage.SCRAP:
        await db.equipment.update_one(
            {"id": existing['equipment_id']},
            {"$set": {"is_usable": False}}
        )
    
    await db.requests.update_one({"id": request_id}, {"$set": update_dict})
    
    updated = await db.requests.find_one({"id": request_id}, {"_id": 0})
    return updated

@api_router.delete("/requests/{request_id}")
async def delete_request(request_id: str):
    result = await db.requests.delete_one({"id": request_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Request deleted"}

# =============================================================================
# ANALYTICS ROUTES
# =============================================================================
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics():
    # Counts by stage
    stages = ["new", "in_progress", "repaired", "scrap"]
    stage_counts = {}
    for stage in stages:
        count = await db.requests.count_documents({"stage": stage})
        stage_counts[stage] = count
    
    # Counts by team
    teams = await db.teams.find({}, {"_id": 0}).to_list(100)
    team_counts = []
    for team in teams:
        count = await db.requests.count_documents({"team_id": team['id']})
        team_counts.append({"name": team['name'], "count": count, "id": team['id']})
    
    # Overdue count (scheduled_date in past, not completed)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    overdue_count = await db.requests.count_documents({
        "scheduled_date": {"$lt": today, "$ne": None},
        "stage": {"$nin": ["repaired", "scrap"]}
    })
    
    # Total equipment and unusable
    total_equipment = await db.equipment.count_documents({})
    unusable_equipment = await db.equipment.count_documents({"is_usable": False})
    
    # Total requests
    total_requests = await db.requests.count_documents({})
    
    # Request type breakdown
    corrective = await db.requests.count_documents({"request_type": "corrective"})
    preventive = await db.requests.count_documents({"request_type": "preventive"})
    
    return {
        "stage_counts": stage_counts,
        "team_counts": team_counts,
        "overdue_count": overdue_count,
        "total_equipment": total_equipment,
        "unusable_equipment": unusable_equipment,
        "total_requests": total_requests,
        "request_types": {
            "corrective": corrective,
            "preventive": preventive
        }
    }

@api_router.get("/analytics/requests-by-category")
async def get_requests_by_category():
    pipeline = [
        {"$group": {"_id": "$equipment_category", "count": {"$sum": 1}}},
        {"$project": {"category": "$_id", "count": 1, "_id": 0}}
    ]
    result = await db.requests.aggregate(pipeline).to_list(100)
    return result

@api_router.get("/analytics/requests-by-team")
async def get_requests_by_team():
    pipeline = [
        {"$group": {"_id": "$team_name", "count": {"$sum": 1}}},
        {"$project": {"team": "$_id", "count": 1, "_id": 0}}
    ]
    result = await db.requests.aggregate(pipeline).to_list(100)
    return result

# Include the router in the main app
app.include_router(api_router)


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
