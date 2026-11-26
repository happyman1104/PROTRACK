# PROTRACK - Sistem Pelacakan Barang Logistik WIP

PROTRACK adalah sistem pelacakan barang setengah jadi (_Work In Progress_) yang dirancang khusus untuk digitalisasi dan efisiensi pelaporan logistik multi-kemasan di lantai produksi **PT Gajah Putih Elastic**. Sistem ini menerapkan metode pemrosesan massal (_batch processing_) untuk meminimalkan beban server dan menjaga integritas data logistik secara _real-time_.

---

## 🛠️ Tech Stack & Arsitektur Sistem

Aplikasi ini dibangun menggunakan arsitektur modern berkinerja tinggi yang sepenuhnya berjalan secara lokal (_100% Offline-Safe_) untuk menjamin kelancaran operasional di lingkungan pabrik tanpa ketergantungan internet:

- **Frontend:** Next.js (React Framework) & Tailwind CSS
- **Backend:** FastAPI (Python Web Framework) & Uvicorn ASGI Server
- **Database:** MySQL (XAMPP) dengan SQLAlchemy ORM
- **Komponen UI pendukung:** SweetAlert2 untuk notifikasi operasional interaktif

---

## ✨ Fitur Utama (Final Scope)

1.  **Validasi No. SPK Real-Time:** Operator cukup memasukkan Nomor SPK (Surat Perintah Kerja), dan sistem akan mengotomatisasi pengisian data _Customer_, _Article_, dan _Colour_ langsung dari database pusat.
2.  **Mode Input Manual (Fallback System):** Solusi alternatif apabila Nomor SPK fisik belum sempat diterbitkan oleh Admin PPIC di sistem pusat, sehingga alur logistik lapangan tidak terhambat.
3.  **Pemrosesan Massal (Batch Processing):** Fitur antrean draf yang memungkinkan operator mengumpulkan data beberapa wadah/kemasan terlebih dahulu sebelum memproses pengiriman massal sekaligus ke database dalam satu kali klik.
4.  **Manifes Otomatis:** Pembaruan data transaksi secara instan di sisi bagian _shipping_ untuk kebutuhan penyiapan armada logistik.

> 📌 **Catatan Ruang Lingkup Proyek:** Berdasarkan analisis efisiensi di lantai produksi, fitur _Kamera Scanning OCR (Handwritten)_ dan _Cloud Deployment_ sengaja dipangkas (_scope cutting_) demi menjaga akurasi 100% data logistik terstruktur dan memastikan sistem kebal terhadap gangguan jaringan internet buruk.

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi (Localhost)

Ikuti urutan langkah prosedural di bawah ini untuk memasang dan menjalankan seluruh subsistem PROTRACK di perangkat lokal Anda.

### 1. Prasyarat Sistem (Prerequisites)

Pastikan perangkat Anda sudah terpasang:

- Python (Versi 3.8 atau lebih baru)
- Node.js (Versi 18 atau lebih baru)
- XAMPP Control Panel

### 2. Konfigurasi Basis Data (MySQL)

1.  Buka **XAMPP Control Panel**, lalu aktifkan modul **Apache** dan **MySQL** (Klik tombol _Start_).
2.  Buka peramban web (_browser_), lalu akses alamat: `http://localhost/phpmyadmin`.
3.  Buat database baru dengan nama: **`protrack_db`**.
4.  Lakukan _Import_ file database dummy/dump resmi (misal: `protrack_db.sql`) ke dalam database tersebut untuk memuat sampel data pesanan (_orders_).

### 3. Konfigurasi Backend (FastAPI)

1.  Buka Terminal atau Command Prompt baru, lalu masuk ke direktori backend:
    ```bash
    cd backend
    ```
2.  Buat dan aktifkan _Virtual Environment_ Python:
    - **Windows:** `python -m venv venv` lalu aktifkan dengan `venv\Scripts\activate`
    - **Mac/Linux:** `python3 -m venv venv` lalu aktifkan dengan `source venv/bin/activate`
3.  Instal seluruh pustaka/dependensi Python yang terdaftar:
    ```bash
    pip install -r requirements.txt
    ```
4.  Jalankan server backend Uvicorn:
    ```bash
    uvicorn main:app --reload
    ```
5.  Pastikan muncul log terminal `Application startup complete.` pada alamat `http://127.0.0.1:8000`.

### 4. Konfigurasi Frontend (Next.js)

1.  Buka jendela Terminal baru yang terpisah, lalu masuk ke direktori frontend:
    ```bash
    cd frontend
    ```
2.  Instal seluruh paket dependensi Node.js (Hanya dilakukan pada instalasi pertama):
    ```bash
    npm install
    ```
3.  Jalankan server pengembangan lokal Next.js:
    ```bash
    npm run dev
    ```
4.  Buka browser dan akses antarmuka sistem PROTRACK melalui URL resmi: **`http://localhost:3000`**.

---

## 🔑 Data Akun Simulasi Pengujian (Dummy User)

Untuk melakukan simulasi alur kerja pengiriman barang pada demo aplikasi, gunakan kredensial akun operator berikut pada halaman login:

- **Username:** `operator_1`
- **Password:** `password123`
