from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from dependencies import RoleChecker, get_current_user # 🌟 TAMBAHKAN import get_current_user di sini

router = APIRouter(
    prefix="/orders",
    tags=["Manajemen SPK (Order)"]
)

# 1. Endpoint Menambah SPK Baru (Gembok Ketat: PPIC, Admin Produksi, IT)
@router.post("/", response_model=schemas.Order)
def create_order(
    order: schemas.OrderBase, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RoleChecker([models.RoleEnum.ppic, models.RoleEnum.admin_produksi, models.RoleEnum.staff_it]))
):
    # Validasi duplikasi Nomor SPK
    db_order = db.query(models.Order).filter(models.Order.no_spk == order.no_spk).first()
    if db_order:
        raise HTTPException(status_code=400, detail="Nomor SPK tersebut sudah terdaftar di sistem!")
    
    # Membuat objek Order baru dengan data lengkap sesuai label produksi
    new_order = models.Order(
        no_spk=order.no_spk,
        no_so=order.no_so,
        nama_customer=order.nama_customer,
        nama_artikel=order.nama_artikel,
        warna=order.warna,
        no_mesin=order.no_mesin,
        catatan=order.catatan,
        total_order_qty=order.total_order_qty,
        tanggal_lunas=order.tanggal_lunas
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    return new_order

# 2. Endpoint Mengambil Semua Data Master SPK (Gembok: Semua User Terdaftar & Urut Terbaru)
@router.get("/", response_model=list[schemas.Order])
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # 🔒 Dilindungi token JWT
):
    # 🌟 Diurutkan dari ID terbesar (desc) agar SPK terbaru muncul di paling atas tabel web
    return db.query(models.Order).order_by(models.Order.id.desc()).all()

# 3. Endpoint Mencari Spesifik SPK
@router.get("/{no_spk}", response_model=schemas.Order)
def get_order_by_spk(
    no_spk: str, 
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.no_spk == no_spk.strip().upper()).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Nomor SPK tidak ditemukan di database!")
    
    return order