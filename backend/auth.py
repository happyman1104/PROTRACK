from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

# Kunci rahasia untuk menyegel JWT (Nanti di versi production, pindahkan ke file .env)
SECRET_KEY = "protrack_super_rahasia_gajah_putih_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Token berlaku 1 hari penuh

# Konfigurasi Hashing Password menggunakan Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Mencetak Token JWT
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt