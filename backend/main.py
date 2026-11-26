# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import users, orders, shipments, auth_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ProTrack API",
    description="Backend Sistem Pelacakan Barang PT Gajah Putih Elastic",
    version="1.0.0"
)

# CORS khusus environment lokal (Next.js dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(orders.router)
app.include_router(shipments.router)
app.include_router(auth_router.router)


@app.get("/")
def read_root():
    return {"message": "Selamat datang di API ProTrack. Server berjalan dengan baik!"}
