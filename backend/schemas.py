from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime, date
from models import RoleEnum, StatusEnum


# ------------------- SCHEMA USER -------------------
class UserBase(BaseModel):
    # Validasi: Min 4 karakter, tanpa spasi
    username: str = Field(..., min_length=4, pattern=r"^\S+$", description="Username tanpa spasi")
    nama_lengkap: str = Field(..., min_length=3)
    role: RoleEnum


class UserRegister(BaseModel):
    # Registrasi publik tidak mengizinkan pemilihan role (selalu operator)
    username: str = Field(..., min_length=4, pattern=r"^\S+$", description="Username tanpa spasi")
    nama_lengkap: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class UserCreate(UserBase):
    # Khusus pembuatan akun oleh Staff IT dengan role spesifik
    password: str = Field(..., min_length=6)


class UserRoleUpdate(BaseModel):
    role: RoleEnum


class User(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ------------------- SCHEMA ORDER (SPK) -------------------
class OrderBase(BaseModel):
    no_spk: str
    no_so: str
    nama_customer: str
    nama_artikel: str
    warna: str
    no_mesin: Optional[str] = None
    catatan: Optional[str] = None
    total_order_qty: Optional[float] = None
    tanggal_lunas: Optional[date] = None


class Order(OrderBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ------------------- SCHEMA WIP SHIPMENT -------------------
class WipShipmentBase(BaseModel):
    order_id: int
    quantity: float = Field(..., gt=0)
    jumlah_kemasan: int = Field(..., gt=0)
    jenis_kemasan: str = Field(default="box", description="Pilihan: box, karung, kardus, plastik")
    no_mesin: str
    catatan: Optional[str] = None


class WipShipmentCreate(WipShipmentBase):
    # Opsional untuk kompatibilitas klien; server selalu menggunakan current_user.id dari JWT
    pengirim_id: Optional[int] = None


class WipShipmentUpdate(BaseModel):
    # Opsional untuk kompatibilitas klien; server selalu menggunakan current_user.id dan now_wib()
    penerima_id: Optional[int] = None
    status: StatusEnum = StatusEnum.diterima
    waktu_terima: Optional[datetime] = None


class WipShipment(WipShipmentBase):
    id: int
    pengirim_id: int
    penerima_id: Optional[int] = None
    status: StatusEnum
    waktu_kirim: datetime
    waktu_terima: Optional[datetime] = None
    foto_label_url: Optional[str] = None
    order: Optional[Order] = None
    pengirim: Optional[User] = None
    penerima: Optional[User] = None
    model_config = ConfigDict(from_attributes=True)


# ------------------- SCHEMA LAINNYA -------------------
class UserLogin(BaseModel):
    username: str
    password: str


class UnverifiedShipmentCreate(BaseModel):
    no_spk_manual: str
    nama_artikel_manual: str
    warna_manual: Optional[str] = None
    nama_customer_manual: Optional[str] = None
    quantity: float = Field(..., gt=0)
    jumlah_kemasan: int = Field(..., gt=0)
    jenis_kemasan: str = Field(default="box")
    no_mesin: str
    catatan: Optional[str] = None
    # Opsional untuk kompatibilitas klien; server selalu menggunakan current_user.id dari JWT
    pengirim_id: Optional[int] = None


class UnverifiedShipment(BaseModel):
    id: int
    no_spk_manual: str
    nama_artikel_manual: str
    warna_manual: Optional[str] = None
    nama_customer_manual: Optional[str] = None
    quantity: float
    jumlah_kemasan: int
    jenis_kemasan: str
    no_mesin: str
    catatan: Optional[str] = None
    pengirim_id: int
    status: str
    waktu_kirim: datetime
    pengirim: Optional[User] = None

    model_config = ConfigDict(from_attributes=True)
