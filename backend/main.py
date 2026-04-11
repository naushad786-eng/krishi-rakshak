import jwt
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import engine, get_db
import models, schemas

# Create the database tables automatically when the server starts
models.Base.metadata.create_all(bind=engine)

# Initialize the FastAPI application
app = FastAPI(
    title="Krishi-Rakshak API", 
    description="Backend for AI Plant Disease Diagnosis and Multilingual Voice Queries",
    version="1.0.0"
)

# Set up CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows your React frontend to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Password Hashing Setup ---
# This securely encrypts passwords before saving them to the database
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

# --- Basic API Endpoints ---

@app.get("/")
async def root():
    """Root endpoint to verify the API is reachable."""
    return {"message": "Welcome to the Krishi-Rakshak API. System is online."}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy", 
        "active_modules": ["api_core", "database"]
    }

# --- Authentication Endpoints ---

@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Registers a new farmer/user in the system."""
    
    # 1. Check if the email is already registered in the database
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash the password for security
    hashed_pwd = get_password_hash(user.password)
    
    # 3. Create the new user object using the SQLAlchemy model
    new_user = models.User(
        name=user.name, 
        email=user.email, 
        hashed_password=hashed_pwd
    )
    
    # 4. Save the new user to the SQLite database
    db.add(new_user)
    db.commit()
    db.refresh(new_user) # Retrieves the newly auto-generated ID
    
    # 5. Return the user info (excluding the password, thanks to schemas.UserResponse)
    return new_user

# --- JWT Token Configuration ---
# In a real production app, this secret key should be hidden in a .env file!
SECRET_KEY = "super_secret_krishi_rakshak_key" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def verify_password(plain_password, hashed_password):
    """Checks if the typed password matches the scrambled one in the database."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    """Generates the secure JWT digital ID card."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/login", response_model=schemas.Token)
def login_user(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Verifies user credentials and returns a secure login token."""
    
    # 1. Find the user by their email
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    
    # 2. If the user doesn't exist, throw an error
    if not user:
        raise HTTPException(status_code=403, detail="Invalid Credentials")
    
    # 3. If the password doesn't match, throw an error
    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=403, detail="Invalid Credentials")
    
    # 4. If everything matches, create the digital ID card (JWT token)
    access_token = create_access_token(data={"sub": user.email})
    
    return {"access_token": access_token, "token_type": "bearer"}