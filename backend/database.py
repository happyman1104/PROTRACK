import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Memuat file .env dari root proyek (maupun folder kerja saat ini)
ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ROOT_ENV)
load_dotenv()

# Mengambil data dari .env
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# Format URL koneksi MySQL untuk SQLAlchemy
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Membuat Engine (Mesin penghubung)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Membuat Session (Untuk melakukan transaksi ke database)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class untuk membuat model (Tabel)
Base = declarative_base()


# Dependency untuk mendapatkan koneksi database di setiap request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
