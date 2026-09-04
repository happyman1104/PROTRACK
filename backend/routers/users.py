from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

# Membuat instance router khusus untuk Users
router = APIRouter(
    prefix="/users",
    tags=["Manajemen User"]
)

# 1. Endpoint untuk Menambah User Baru (CREATE)
@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Cek apakah username sudah dipakai
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username sudah terdaftar!")
    
    # HINT: Secara profesional password harus di-hash (dienkripsi) di sini.
    # Untuk sementara kita simpan teks asli dulu agar fokus ke alur router.
    fake_hashed_password = user.password + "notreallyhashed" 
    
    # Memasukkan data ke database (SQLAlchemy)
    new_user = models.User(
        username=user.username,
        password=fake_hashed_password,
        nama_lengkap=user.nama_lengkap,
        role=user.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

# 2. Endpoint untuk Melihat Daftar Semua User (READ)
@router.get("/", response_model=list[schemas.User])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

# 3. Endpoint untuk Login User
@router.post("/login", response_model=schemas.User)
def login_user(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Username tidak terdaftar!")
    
    fake_hashed_password = user_data.password + "notreallyhashed"
    if user.password != fake_hashed_password:
        raise HTTPException(status_code=400, detail="Password salah!")
    return user