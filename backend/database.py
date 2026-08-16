import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Grab the URL from Render
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Add our Debug Tracker
if SQLALCHEMY_DATABASE_URL:
    print("🟢 SUCCESS: Connecting to Cloud PostgreSQL Database!")
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
else:
    print("🔴 WARNING: Cloud DB not found. Falling back to temporary SQLite!")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./database.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()