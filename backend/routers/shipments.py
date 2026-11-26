from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
import models, schemas
import io
import pandas as pd
from fastapi.responses import StreamingResponse
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

from dependencies import RoleChecker, get_current_user
from models import RoleEnum, now_wib

router = APIRouter(
    prefix="/shipments",
    tags=["Pelacakan Barang (WIP)"]
)

# =====================================================================
# DEFINISI GEMBOK AKSES BERDASARKAN ROLE
# =====================================================================
allow_operator_lapangan = RoleChecker([RoleEnum.operator, RoleEnum.admin_produksi, RoleEnum.staff_it])
allow_ppic_admin = RoleChecker([RoleEnum.ppic, RoleEnum.admin_produksi, RoleEnum.staff_it])
allow_management = RoleChecker([
    RoleEnum.ppic,
    RoleEnum.kepala_bagian,
    RoleEnum.kepala_departemen,
    RoleEnum.admin_produksi,
    RoleEnum.staff_it,
])


# 1. Endpoint Mengirim Barang (Gembok: Operator Lapangan)
@router.post("/", response_model=schemas.WipShipment)
def create_shipment(
    shipment: schemas.WipShipmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_operator_lapangan)
):
    order = db.query(models.Order).filter(models.Order.id == shipment.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Data SPK tidak ditemukan!")

    # Gunakan current_user.id dari token JWT agar identitas pengirim tidak dapat dipalsukan
    new_shipment = models.WipShipment(
        order_id=shipment.order_id,
        quantity=shipment.quantity,
        jumlah_kemasan=shipment.jumlah_kemasan,
        jenis_kemasan=shipment.jenis_kemasan,
        no_mesin=shipment.no_mesin,
        pengirim_id=current_user.id,
        catatan=shipment.catatan,
        waktu_kirim=now_wib()
    )

    db.add(new_shipment)
    db.commit()
    db.refresh(new_shipment)
    return new_shipment


# 2. Endpoint Menerima Barang (Gembok: Operator Lapangan)
@router.put("/{shipment_id}/receive", response_model=schemas.WipShipment)
def receive_shipment(
    shipment_id: int,
    update_data: schemas.WipShipmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_operator_lapangan)
):
    shipment = db.query(models.WipShipment).filter(models.WipShipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Data pengiriman tidak ditemukan!")

    if shipment.status == models.StatusEnum.diterima:
        raise HTTPException(status_code=400, detail="Barang ini sudah berstatus diterima sebelumnya!")

    # Gunakan current_user.id dari token JWT dan waktu server WIB
    shipment.penerima_id = current_user.id
    shipment.status = update_data.status
    shipment.waktu_terima = now_wib()

    db.commit()
    db.refresh(shipment)
    return shipment


# 3. Endpoint Dashboard Global (Gembok: Semua Karyawan Terdaftar)
@router.get("/", response_model=list[schemas.WipShipment])
def get_all_shipments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.WipShipment).options(
        joinedload(models.WipShipment.order),
        joinedload(models.WipShipment.pengirim),
        joinedload(models.WipShipment.penerima)
    ).order_by(models.WipShipment.id.desc()).all()


# 4. Endpoint Menyimpan Barang Tanpa SPK / Booking (Gembok: Operator Lapangan)
@router.post("/unverified-shipments/")
def create_unverified_shipment(
    payload: schemas.UnverifiedShipmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_operator_lapangan)
):
    data = payload.model_dump(exclude={"pengirim_id"})
    db_item = models.UnverifiedShipment(
        **data,
        pengirim_id=current_user.id,
        waktu_kirim=now_wib()
    )

    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return {
        "status": "success",
        "message": "Barang tanpa SPK resmi berhasil disimpan.",
        "data": schemas.UnverifiedShipment.model_validate(db_item)
    }


# 5. Endpoint Mengambil Daftar Booking Darurat (Gembok: Manajemen)
@router.get("/unverified-shipments/", response_model=list[schemas.UnverifiedShipment])
def get_unverified_shipments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_management)
):
    return db.query(models.UnverifiedShipment).options(
        joinedload(models.UnverifiedShipment.pengirim)
    ).filter(
        models.UnverifiedShipment.status == "dikirim"
    ).order_by(models.UnverifiedShipment.id.desc()).all()


# 6. Endpoint Tautkan SPK Resmi (Gembok Eksklusif: PPIC, Admin Produksi, Staff IT)
@router.post("/unverified-shipments/{shipment_id}/verify")
def verify_unverified_shipment(
    shipment_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_ppic_admin)
):
    no_spk_resmi = payload.get("no_spk_resmi")
    if not no_spk_resmi:
        raise HTTPException(status_code=400, detail="Nomor SPK Resmi dari PPIC wajib diisi!")

    unverified_item = db.query(models.UnverifiedShipment).filter(
        models.UnverifiedShipment.id == shipment_id
    ).first()
    if not unverified_item:
        raise HTTPException(status_code=404, detail="Data transaksi logistik booking tidak ditemukan.")

    if unverified_item.status == "tervalidasi":
        raise HTTPException(status_code=400, detail="Data booking ini sudah tervalidasi sebelumnya.")

    order = db.query(models.Order).filter(
        models.Order.no_spk == no_spk_resmi.strip().upper()
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail=f"Gagal sinkronisasi! Nomor {no_spk_resmi} belum ada di data Master Orders PPIC. Silakan input master ordernya terlebih dahulu."
        )

    verified_shipment = models.WipShipment(
        order_id=order.id,
        quantity=unverified_item.quantity,
        jumlah_kemasan=unverified_item.jumlah_kemasan,
        jenis_kemasan=unverified_item.jenis_kemasan,
        no_mesin=unverified_item.no_mesin,
        catatan=f"SINKRONISASI OTOMATIS: Berasal dari Booking ID ({unverified_item.no_spk_manual}). " + (unverified_item.catatan or ""),
        pengirim_id=unverified_item.pengirim_id,
        waktu_kirim=unverified_item.waktu_kirim or now_wib()
    )
    db.add(verified_shipment)
    unverified_item.status = "tervalidasi"
    db.commit()
    return {"status": "success", "message": f"Berhasil menautkan data ke {order.no_spk} secara legal!"}


# 7. Endpoint Cetak Laporan Excel (Gembok: Level Manajemen Ke Atas)
@router.get("/reports/excel")
def export_shipments_to_excel(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_management)
):
    shipments = db.query(models.WipShipment).options(
        joinedload(models.WipShipment.order),
        joinedload(models.WipShipment.pengirim),
        joinedload(models.WipShipment.penerima)
    ).order_by(models.WipShipment.id.desc()).all()

    unverified_shipments = db.query(models.UnverifiedShipment).options(
        joinedload(models.UnverifiedShipment.pengirim)
    ).filter(
        models.UnverifiedShipment.status == "dikirim"
    ).order_by(models.UnverifiedShipment.id.desc()).all()

    report_data = []

    for item in shipments:
        status_text = item.status.value if hasattr(item.status, "value") else str(item.status)
        report_data.append({
            "No SPK": item.order.no_spk if item.order else "N/A",
            "No SO": item.order.no_so if item.order else "-",
            "Nama Customer": item.order.nama_customer if item.order else "-",
            "Artikel WIP": item.order.nama_artikel if item.order else "Produk Kosong",
            "Warna": item.order.warna if item.order else "-",
            "Kuantitas (Kg)": item.quantity,
            "Jumlah Kemasan": item.jumlah_kemasan,
            "No Mesin": f"MC-{item.no_mesin}",
            "Status Logistik": status_text.upper(),
            "Waktu Pengiriman": item.waktu_kirim.strftime("%d %b %Y, %H:%M") if item.waktu_kirim else "-",
            "Operator Pengirim": item.pengirim.nama_lengkap if item.pengirim else "-",
            "Waktu Penerimaan": item.waktu_terima.strftime("%d %b %Y, %H:%M") if item.waktu_terima else "-",
            "Operator Penerima": item.penerima.nama_lengkap if item.penerima else "-",
            "Kategori Dokumen": "RESMI (TERDAFTAR)"
        })

    for item in unverified_shipments:
        report_data.append({
            "No SPK": f"{item.no_spk_manual} [BOOKING]",
            "No SO": "-",
            "Nama Customer": item.nama_customer_manual or "-",
            "Artikel WIP": item.nama_artikel_manual or "Produk Kosong",
            "Warna": item.warna_manual or "-",
            "Kuantitas (Kg)": item.quantity,
            "Jumlah Kemasan": item.jumlah_kemasan,
            "No Mesin": f"MC-{item.no_mesin}",
            "Status Logistik": "PENDING PPIC (MANUAL)",
            "Waktu Pengiriman": item.waktu_kirim.strftime("%d %b %Y, %H:%M") if item.waktu_kirim else "-",
            "Operator Pengirim": item.pengirim.nama_lengkap if item.pengirim else "-",
            "Waktu Penerimaan": "-",
            "Operator Penerima": "-",
            "Kategori Dokumen": "BELUM VALIDASI (URGENT)"
        })

    if not report_data:
        report_data.append({
            "No SPK": "-", "No SO": "-", "Nama Customer": "-", "Artikel WIP": "-", "Warna": "-",
            "Kuantitas (Kg)": 0, "Jumlah Kemasan": 0, "No Mesin": "-", "Status Logistik": "-",
            "Waktu Pengiriman": "-", "Operator Pengirim": "-", "Waktu Penerimaan": "-", "Operator Penerima": "-", "Kategori Dokumen": "-"
        })

    df = pd.DataFrame(report_data)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Rekap Manifest Harian")

        worksheet = writer.sheets["Rekap Manifest Harian"]

        header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
        header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")

        for col_num, _column_title in enumerate(df.columns, 1):
            cell = worksheet.cell(row=1, column=col_num)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

        for col in worksheet.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            col_letter = get_column_letter(col[0].column)
            worksheet.column_dimensions[col_letter].width = max(max_len + 4, 12)

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ProTrack_Daily_Manifest.xlsx"}
    )
