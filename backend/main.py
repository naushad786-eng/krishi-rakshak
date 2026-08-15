import jwt
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import engine, get_db
import models, schemas

from fastapi import UploadFile, File, Form
import tensorflow as tf
from PIL import Image
import numpy as np
import io

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
    allow_credentials=False,
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

# ==========================================
# KRISHI-RAKSHAK AI DIAGNOSTIC ENGINE
# ==========================================

print("Loading Krishi-Rakshak AI Brain...")
MODEL_PATH = "krishi_rakshak_model.h5"

# --- THE BULLETPROOF AI PATCH ---
# Colab sometimes sneaks a 'quantization_config' into the Dense layer when saving,
# but the cloud server crashes when reading it. This safely ignores that bug!
class SafeDense(tf.keras.layers.Dense):
    def __init__(self, *args, **kwargs):
        kwargs.pop('quantization_config', None)
        super().__init__(*args, **kwargs)

# Load the model using our patch
disease_model = tf.keras.models.load_model(MODEL_PATH, custom_objects={'Dense': SafeDense})
print("✅ AI Brain Loaded Successfully!")

# 2. ENRICHED MULTILINGUAL DICTIONARY (FULLY POPULATED)
CLASS_INFO = {
        0: {
            "en": {"name": "Pepper: Bacterial Spot", "treatment": "Remove infected leaves. Apply copper-based spray."},
            "hi": {"name": "शिमला मिर्च: बैक्टीरियल स्पॉट", "treatment": "संक्रमित पत्तियों को हटा दें। कॉपर-आधारित स्प्रे का प्रयोग करें।"},
            "ta": {"name": "குடைமிளகாய்: பாக்டீரியா புள்ளி", "treatment": "பாதிக்கப்பட்ட இலைகளை அகற்றவும். செம்பு கலந்த மருந்தை தெளிக்கவும்."}
        },
        1: {
            "en": {"name": "Pepper: Healthy", "treatment": "Your crop is healthy! Maintain regular watering."},
            "hi": {"name": "शिमला मिर्च: स्वस्थ", "treatment": "आपकी फसल स्वस्थ है! नियमित सिंचाई बनाए रखें।"},
            "ta": {"name": "குடைமிளகாய்: ஆரோக்கியமானது", "treatment": "உங்கள் பயிர் ஆரோக்கியமாக உள்ளது! முறையாக நீர் பாய்ச்சவும்."}
        },
        2: {
            "en": {"name": "Tomato: Bacterial Spot", "treatment": "Remove infected leaves. Apply copper-based spray. Space plants to improve airflow."},
            "hi": {"name": "टमाटर: बैक्टीरियल स्पॉट", "treatment": "संक्रमित पत्तियों को हटा दें। कॉपर स्प्रे लगाएं और पौधों के बीच जगह रखें।"},
            "ta": {"name": "தக்காளி: பாக்டீரியா புள்ளி", "treatment": "பாதிக்கப்பட்ட இலைகளை அகற்றவும். செடிகளுக்கு இடையே காற்றோட்டத்தை அதிகரிக்கவும்."}
        },
        3: {
            "en": {"name": "Tomato: Early Blight", "treatment": "Remove affected bottom leaves. Apply organic copper fungicide."},
            "hi": {"name": "टमाटर: अगेती झुलसा", "treatment": "प्रभावित निचली पत्तियों को हटा दें। जैविक कवकनाशी लागू करें।"},
            "ta": {"name": "தக்காளி: முன் இலைக்கருகல்", "treatment": "பாதிக்கப்பட்ட அடிப்பகுதி இலைகளை அகற்றவும். பூஞ்சைக் கொல்லியைப் பயன்படுத்தவும்."}
        },
        4: {
            "en": {"name": "Tomato: Late Blight", "treatment": "Severe fungal disease. Remove and destroy infected plants immediately to prevent spread."},
            "hi": {"name": "टमाटर: पछेती झुलसा", "treatment": "गंभीर फंगल रोग। फैलाव रोकने के लिए संक्रमित पौधों को तुरंत नष्ट कर दें।"},
            "ta": {"name": "தக்காளி: தாமத இலைக்கருகல்", "treatment": "கடுமையான பூஞ்சை நோய். பரவுவதைத் தடுக்க பாதிக்கப்பட்ட செடிகளை உடனே அழிக்கவும்."}
        },
        5: {
            "en": {"name": "Tomato: Leaf Mold", "treatment": "Improve air circulation by spacing plants further apart. Avoid wetting leaves."},
            "hi": {"name": "टमाटर: लीफ मोल्ड", "treatment": "पौधों के बीच की दूरी बढ़ाकर वायु संचार में सुधार करें। पत्तियों को गीला करने से बचें।"},
            "ta": {"name": "தக்காளி: இலை பூஞ்சை", "treatment": "செடிகளுக்கு இடையே இடைவெளியை அதிகரித்து காற்றோட்டத்தை மேம்படுத்தவும்."}
        },
        6: {
            "en": {"name": "Tomato: Septoria Leaf Spot", "treatment": "Weed the area regularly. Avoid overhead watering to prevent soil splashing."},
            "hi": {"name": "टमाटर: सेप्टोरिया लीफ स्पॉट", "treatment": "नियमित रूप से खरपतवार निकालें। मिट्टी को पत्तियों पर उछलने से रोकने के लिए ऊपर से पानी न दें।"},
            "ta": {"name": "தக்காளி: செப்டோரியா இலைப்புள்ளி", "treatment": "தொடர்ந்து களை எடுக்கவும். மேலிருந்து நீர் பாய்ச்சுவதைத் தவிர்க்கவும்."}
        },
        7: {
            "en": {"name": "Tomato: Spider Mites", "treatment": "Spray with neem oil or insecticidal soap. Maintain good humidity."},
            "hi": {"name": "टमाटर: स्पाइडर माइट्स", "treatment": "नीम के तेल या कीटनाशक साबुन का छिड़काव करें। अच्छी नमी बनाए रखें।"},
            "ta": {"name": "தக்காளி: சிலந்திப் பேன்", "treatment": "வேப்ப எண்ணெய் அல்லது பூச்சிக்கொல்லி சோப்பு தெளிக்கவும். ஈரப்பதத்தை பராமரிக்கவும்."}
        },
        8: {
            "en": {"name": "Tomato: Target Spot", "treatment": "Apply a standard fungicide. Improve airflow around plants and avoid wetting foliage."},
            "hi": {"name": "टमाटर: टारगेट स्पॉट", "treatment": "एक मानक कवकनाशी लागू करें। वायु प्रवाह में सुधार करें।"},
            "ta": {"name": "தக்காளி: இலக்கு புள்ளி", "treatment": "பூஞ்சைக் கொல்லியைப் பயன்படுத்தவும். காற்றோட்டத்தை மேம்படுத்தவும்."}
        },
        9: {
            "en": {"name": "Tomato: Yellow Leaf Curl Virus", "treatment": "Transmitted by whiteflies. Use neem oil to control whiteflies. Uproot infected plants."},
            "hi": {"name": "टमाटर: येलो लीफ कर्ल वायरस", "treatment": "सफेद मक्खियों द्वारा फैलता है। संक्रमित पौधों को उखाड़ दें और नीम के तेल का प्रयोग करें।"},
            "ta": {"name": "தக்காளி: மஞ்சள் இலை சுருட்டு வைரஸ்", "treatment": "வெள்ளை ஈக்களால் பரவுகிறது. பாதிக்கப்பட்ட செடிகளை பிடுங்கி வேப்ப எண்ணெய் பயன்படுத்தவும்."}
        },
        10: {
            "en": {"name": "Tomato: Mosaic Virus", "treatment": "No cure exists. Uproot and burn infected plants immediately. Wash hands and tools."},
            "hi": {"name": "टमाटर: मोज़ेक वायरस", "treatment": "कोई इलाज नहीं है। संक्रमित पौधों को तुरंत उखाड़ कर जला दें। हाथ और उपकरण धो लें।"},
            "ta": {"name": "தக்காளி: தேமல் வைரஸ்", "treatment": "சிகிச்சை இல்லை. பாதிக்கப்பட்ட செடிகளை பிடுங்கி எரிக்கவும். கருவிகளை கழுவவும்."}
        },
        11: {
            "en": {"name": "Tomato: Healthy", "treatment": "Your crop is healthy! Maintain regular watering and good sunlight."},
            "hi": {"name": "टमाटर: स्वस्थ", "treatment": "आपकी फसल स्वस्थ है! नियमित सिंचाई और धूप बनाए रखें।"},
            "ta": {"name": "தக்காளி: ஆரோக்கியமானது", "treatment": "உங்கள் பயிர் ஆரோக்கியமாக உள்ளது! முறையாக நீர் பாய்ச்சவும்."}
        }
    }

# 3. UPDATE THE ENDPOINT TO ACCEPT NOTES AND RETURN ALL 3 LANGUAGES
@app.post("/predict")
async def predict_disease(file: UploadFile = File(...), notes: str = Form(None)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        image = image.resize((224, 224))
        img_array = np.array(image) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        predictions = disease_model.predict(img_array)
        predicted_class_index = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0]))
        
        # Use generic fallback if class 4-11 is hit before you translate them
        fallback = {
            "en": {"name": f"Disease Code {predicted_class_index}", "treatment": "Apply general fungicide."},
            "hi": {"name": f"रोग कोड {predicted_class_index}", "treatment": "सामान्य कवकनाशी लागू करें।"},
            "ta": {"name": f"நோய் குறியீடு {predicted_class_index}", "treatment": "பூஞ்சைக் கொல்லியைப் பயன்படுத்தவும்."}
        }
        
        disease_data = CLASS_INFO.get(predicted_class_index, fallback)
        
        return {
            "status": "success",
            "confidence": round(confidence * 100, 2),
            "en": disease_data["en"],
            "hi": disease_data["hi"],
            "ta": disease_data["ta"],
            "received_notes": notes # We log the farmer's notes!
        }
        
    except Exception as e:
        return {"status": "error", "detail": str(e)}