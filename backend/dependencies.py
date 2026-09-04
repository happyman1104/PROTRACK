from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import RoleEnum, User
from jose import JWTError, jwt
from auth import SECRET_KEY, ALGORITHM # Memanggil kunci rahasia dari auth.py

# 🌟 FastAPI akan otomatis mencari token di Header -> "Authorization: Bearer <token>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# 🌟 FUNGSI AKTIF BARU: Membedah Token JWT
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token kredensial tidak valid atau sudah kedaluwarsa. Silakan login kembali.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Membuka segel token JWT menggunakan SECRET_KEY
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
        
    # Memeriksa apakah user benar-benar masih terdaftar di database MySQL
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
        
    return user

# 🌟 PENJAGA GERBANG UTAMA (Logikanya tetap sama, namun sumber datanya kini dari JWT)
class RoleChecker:
    def __init__(self, allowed_roles: list[RoleEnum]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses Ditolak! Wewenang Anda ({user.role.value}) tidak diizinkan untuk aksi ini."
            )
        return user