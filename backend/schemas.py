from pydantic import BaseModel

# What we expect to receive from React when a user registers
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

# What we will send back to React (Notice we DO NOT send the password back!)
class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True # This tells Pydantic to read the SQLAlchemy models

# What we expect to receive when a user logs in
class UserLogin(BaseModel):
    email: str
    password: str

# What we will send back upon a successful login (The ID card)
class Token(BaseModel):
    access_token: str
    token_type: str