from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from database import get_db
from dependencies import RoleChecker
import models, schemas, auth

router = APIRouter(
    prefix="/users",
    tags=["Manajemen User (Staff IT)"]
)

# Seluruh manajemen user & role hanya diizinkan untuk Staff IT
allow_staff_it = RoleChecker([models.RoleEnum.staff_it])


# 1. Melihat Daftar Semua User (Khusus Staff IT)
@router.get("/", response_model=list[schemas.User])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_staff_it)
):
    return db.query(models.User).order_by(models.User.id.asc()).all()


# 2. Menambah User Baru dengan Role Tertentu (Khusus Staff IT, password di-hash bcrypt)
@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_staff_it)
):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username sudah terdaftar!")

    hashed_pwd = auth.get_password_hash(user.password)

    new_user = models.User(
        username=user.username,
        password=hashed_pwd,
        nama_lengkap=user.nama_lengkap,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# 3. Mengubah Role User (Khusus Staff IT)
@router.put("/{user_id}/role", response_model=schemas.User)
def update_user_role(
    user_id: int,
    payload: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_staff_it)
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan!")

    if target_user.id == current_user.id and payload.role != models.RoleEnum.staff_it:
        raise HTTPException(
            status_code=400,
            detail="Anda tidak dapat menurunkan role akun Staff IT milik sendiri."
        )

    target_user.role = payload.role
    db.commit()
    db.refresh(target_user)
    return target_user


# 4. Menghapus User (Khusus Staff IT)
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_staff_it)
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan!")

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Anda tidak dapat menghapus akun milik sendiri yang sedang aktif."
        )

    try:
        db.delete(target_user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="User tidak dapat dihapus karena masih memiliki riwayat transaksi pengiriman."
        )

    return {"message": f"Akun '{target_user.username}' berhasil dihapus."}
