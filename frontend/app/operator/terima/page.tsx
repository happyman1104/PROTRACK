"use client";
import React, { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface ShipmentData {
  id: number;
  quantity: number;
  jumlah_kemasan: number;
  jenis_kemasan: string;
  no_mesin: string;
  status: string;
  waktu_kirim: string;
  order?: {
    no_spk: string;
    nama_artikel: string;
    warna: string;
  };
  pengirim?: {
    nama_lengkap: string;
  };
}

export default function TerimaBarangPage() {
  const router = useRouter();
  const [incomingShipments, setIncomingShipments] = useState<ShipmentData[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem("protrack_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchIncomingData = useCallback(async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/shipments/", {
        headers: getAuthHeader(),
      });

      if (response.status === 401 || response.status === 403) {
        Swal.fire({
          icon: "warning",
          title: "Sesi Berakhir",
          text: "Silakan login kembali untuk melanjutkan.",
        }).then(() => {
          localStorage.removeItem("protrack_token");
          localStorage.removeItem("protrack_user");
          router.push("/");
        });
        return;
      }

      if (!response.ok) throw new Error("Gagal mengambil data");

      const data: ShipmentData[] = await response.json();

      // Filter hanya barang yang statusnya masih "dikirim" (belum diterima)
      const filteredData = data.filter((item) => item.status === "dikirim");
      setIncomingShipments(filteredData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const init = async () => {
      await fetchIncomingData();
    };
    void init();
  }, [fetchIncomingData]);

  const handleKonfirmasiTerima = async (shipmentId: number, spk: string) => {
    const userStr = localStorage.getItem("protrack_user");
    const token = localStorage.getItem("protrack_token");
    if (!userStr || !token) {
      localStorage.removeItem("protrack_token");
      localStorage.removeItem("protrack_user");
      router.push("/");
      return;
    }

    const konfirmasi = await Swal.fire({
      title: "Konfirmasi Kedatangan",
      text: `Apakah Anda yakin barang dengan SPK ${spk} sudah tiba dan sesuai secara fisik?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981", // Warna Emerald/Hijau
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Terima Barang",
      cancelButtonText: "Batal",
    });

    if (!konfirmasi.isConfirmed) return;

    Swal.fire({
      title: "Memproses...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/shipments/${shipmentId}/receive`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({
            status: "diterima",
          }),
        },
      );

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil Diterima!",
          text: "Status barang telah diperbarui di sistem.",
          confirmButtonColor: "#10b981",
        });
        setIsLoading(true);
        void fetchIncomingData(); // Segarkan daftar antrean
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: errorData.detail || "Terjadi kesalahan.",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Koneksi Gagal",
        text: "Tidak dapat terhubung ke server.",
      });
    }
  };

  const filteredList = incomingShipments.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.order?.no_spk?.toLowerCase() || "").includes(q) ||
      (item.order?.nama_artikel?.toLowerCase() || "").includes(q)
    );
  });

  const formatWaktu = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const normalISO = isoString.includes(" ")
        ? isoString.replace(" ", "T")
        : isoString;
      const date = new Date(normalISO);
      if (isNaN(date.getTime())) return "-";

      const tgl = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      const jam = date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${tgl}, ${jam} WIB`;
    } catch {
      return "-";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col">
        {/* Header Hijau (Emerald) */}
        <header className="bg-emerald-600 text-white p-4 shadow-md flex items-center gap-4 sticky top-0 z-20">
          <Link
            href="/operator"
            className="bg-white/20 p-2.5 rounded-full hover:bg-white/30 transition backdrop-blur-sm"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight">Terima Barang</h1>
            <p className="text-xs text-emerald-100 font-medium">
              Konfirmasi Kedatangan WIP
            </p>
          </div>
        </header>

        <main className="p-6 flex-1">
          {/* Kolom Pencarian */}
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari SPK atau Nama Artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-slate-800"
            />
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <svg
                className="w-5 h-5 text-emerald-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                ></path>
              </svg>
              Menunggu Diterima ({filteredList.length})
            </h3>
            <button
              onClick={() => {
                setIsLoading(true);
                void fetchIncomingData();
              }}
              className="text-emerald-600 hover:text-emerald-800"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-10 text-slate-400 font-bold">
              Memuat data kedatangan...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 text-center rounded-2xl mt-4">
              <p className="text-sm font-medium text-slate-400">
                Tidak ada barang yang sedang mengarah ke bagian Anda saat ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md tracking-wider">
                        {item.order?.no_spk || "MANUAL"}
                      </span>
                      <h4 className="font-bold text-slate-800 mt-2 leading-tight">
                        {item.order?.nama_artikel || "Artikel Darurat"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Warna: {item.order?.warna || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-xl font-black text-slate-800">
                        {item.quantity} Kg
                      </span>
                      <span className="text-slate-600 font-bold capitalize">
                        {item.jumlah_kemasan} {item.jenis_kemasan || "Box"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-4">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                        Pengirim & Mesin
                      </span>
                      <span className="font-bold text-slate-700">
                        {item.pengirim?.nama_lengkap || "Anonim"} (MC-
                        {item.no_mesin})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                        Waktu Kirim
                      </span>
                      <span className="font-bold text-slate-700">
                        {formatWaktu(item.waktu_kirim)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleKonfirmasiTerima(
                        item.id,
                        item.order?.no_spk || "Manual",
                      )
                    }
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl shadow-md transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    KONFIRMASI BARANG DITERIMA
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
