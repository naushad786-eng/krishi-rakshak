from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Create a local SQLite database file named 'krishi_rakshak.db'
SQLALCHEMY_DATABASE_URL = "sqlite:///./krishi_rakshak.db"

# Connect to the database
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create a session to talk to the database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This is the base class we will use to create our database tables
Base = declarative_base()

# Dependency function to get the database session in our API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()