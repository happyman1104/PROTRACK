from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# Endpoint Pendaftaran Publik (Role dikunci ke operator untuk mencegah privilege escalation)
@router.post("/register")
def register_user(user: schemas.UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username sudah terdaftar!")

    hashed_pwd = auth.get_password_hash(user.password)

    new_user = models.User(
        username=user.username,
        password=hashed_pwd,
        nama_lengkap=user.nama_lengkap,
        role=models.RoleEnum.operator
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "message": "Akun operator berhasil dibuat",
        "user_id": new_user.id,
        "role": new_user.role.value
    }


# Endpoint Login (Mencetak JWT)
@router.post("/login")
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()

    if not user or not auth.verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah!"
        )

    token_data = {
        "sub": user.username,
        "id": user.id,
        "role": user.role.value
    }
    access_token = auth.create_access_token(data=token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "nama_lengkap": user.nama_lengkap,
            "role": user.role.value
        }
    }
