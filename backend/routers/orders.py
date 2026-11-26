from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from dependencies import RoleChecker, get_current_user

router = APIRouter(
    prefix="/orders",
    tags=["Manajemen SPK (Order)"]
)


# 1. Endpoint Menambah SPK Baru (Gembok Ketat: PPIC, Admin Produksi, IT)
@router.post("/", response_model=schemas.Order)
def create_order(
    order: schemas.OrderBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        RoleChecker([models.RoleEnum.ppic, models.RoleEnum.admin_produksi, models.RoleEnum.staff_it])
    )
):
    normalized_spk = order.no_spk.strip().upper()

    # Validasi duplikasi Nomor SPK
    db_order = db.query(models.Order).filter(models.Order.no_spk == normalized_spk).first()
    if db_order:
        raise HTTPException(status_code=400, detail="Nomor SPK tersebut sudah terdaftar di sistem!")

    new_order = models.Order(
        no_spk=normalized_spk,
        no_so=order.no_so.strip(),
        nama_customer=order.nama_customer.strip(),
        nama_artikel=order.nama_artikel.strip(),
        warna=order.warna.strip(),
        qty=0,
        no_mesin=order.no_mesin,
        catatan=order.catatan,
        total_order_qty=order.total_order_qty,
        tanggal_lunas=order.tanggal_lunas
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return new_order


# 2. Endpoint Mengambil Semua Data Master SPK (Dilindungi JWT)
@router.get("/", response_model=list[schemas.Order])
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Order).order_by(models.Order.id.desc()).all()


# 3. Endpoint Mencari Spesifik SPK (Dilindungi JWT)
@router.get("/{no_spk}", response_model=schemas.Order)
def get_order_by_spk(
    no_spk: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    order = db.query(models.Order).filter(models.Order.no_spk == no_spk.strip().upper()).first()

    if not order:
        raise HTTPException(status_code=404, detail="Nomor SPK tidak ditemukan di database!")

    return order
