from sqlalchemy import TIMESTAMP, Column, Integer, String, Text, Numeric, ForeignKey, Enum as SQLEnum, DateTime, Date, text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

# 1. Mendefinisikan Pilihan ENUM menggunakan library bawaan Python
# 🌟 UPDATE ROLE: 6 Hak Akses Berjenjang Baru
class RoleEnum(str, enum.Enum):
    operator = "operator"
    ppic = "ppic"
    kepala_bagian = "kepala_bagian"
    kepala_departemen = "kepala_departemen"
    admin_produksi = "admin_produksi"
    staff_it = "staff_it"

class StatusEnum(str, enum.Enum):
    dikirim = "dikirim"
    diterima = "diterima"
    bermasalah = "bermasalah"

# 2. Model Tabel Users
class User(Base):
    __tablename__ = "users" 

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    nama_lengkap = Column(String(100), nullable=False)
    role = Column(SQLEnum(RoleEnum), nullable=False, default=RoleEnum.operator)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi balik: Satu user bisa mengirim dan menerima banyak barang
    shipments_sent = relationship("WipShipment", foreign_keys='WipShipment.pengirim_id', back_populates="pengirim")
    shipments_received = relationship("WipShipment", foreign_keys='WipShipment.penerima_id', back_populates="penerima")

# 3. Model Tabel Orders (SPK & SO)
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    no_spk = Column(String(50), unique=True, nullable=False)
    no_so = Column(String(50), nullable=False)
    nama_customer = Column(String(150), nullable=False)
    nama_artikel = Column(String(150), nullable=False)
    warna = Column(String(50), nullable=False)
    no_mesin = Column(String(50), nullable=True) 
    catatan = Column(Text, nullable=True)
    total_order_qty = Column(Numeric(10, 2), nullable=True) # Target produksi total
    tanggal_lunas = Column(Date, nullable=True)             # Deadline / Jatuh tempo

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi balik: Satu SPK bisa memiliki banyak riwayat pengiriman
    shipments = relationship("WipShipment", back_populates="order")

# 4. Model Tabel Transaksi Pengiriman (WIP)
class WipShipment(Base):
    __tablename__ = "wip_shipments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    jumlah_kemasan = Column(Integer, nullable=False)
    jenis_kemasan = Column(String(50), nullable=False, default="box")
    no_mesin = Column(String(50), nullable=False)
    
    # Foreign Key untuk melacak siapa yang kirim dan siapa yang terima
    pengirim_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    penerima_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    status = Column(SQLEnum(StatusEnum), default=StatusEnum.dikirim)
    waktu_kirim = Column(DateTime, default=datetime.utcnow)
    waktu_terima = Column(DateTime, nullable=True)
    foto_label_url = Column(Text, nullable=True)
    catatan = Column(Text, nullable=True)

    # Membangun Relasi Antar Tabel agar mudah dipanggil di Python
    order = relationship("Order", back_populates="shipments")
    pengirim = relationship("User", foreign_keys=[pengirim_id], back_populates="shipments_sent")
    penerima = relationship("User", foreign_keys=[penerima_id], back_populates="shipments_received")

# 5. Model Tabel Barang Tanpa SPK (Darurat)
class UnverifiedShipment(Base):
    __tablename__ = "unverified_shipments"

    id = Column(Integer, primary_key=True, index=True)
    no_spk_manual = Column(String(50), nullable=False)
    nama_artikel_manual = Column(String(100), nullable=False)
    warna_manual = Column(String(50))
    nama_customer_manual = Column(String(100))
    quantity = Column(Numeric(10, 2), nullable=False)
    jumlah_kemasan = Column(Integer, nullable=False)
    jenis_kemasan = Column(String(50), nullable=False, default="box")
    no_mesin = Column(String(20), nullable=False)
    catatan = Column(Text)
    pengirim_id = Column(Integer, nullable=False)
    status = Column(String(20), server_default="dikirim")
    waktu_kirim = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))