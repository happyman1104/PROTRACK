"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

interface ShipmentData {
  id: number;
  quantity: number;
  jumlah_kemasan: number;
  jenis_kemasan: string;
  no_mesin: string;
  catatan: string;
  status: "dikirim" | "diterima" | "bermasalah";
  waktu_kirim?: string;
  waktu_terima?: string;
  order?: {
    no_spk: string;
    no_so: string;
    nama_customer: string;
    nama_artikel: string;
    warna: string;
  };
  pengirim?: {
    nama_lengkap: string;
  };
  penerima?: {
    nama_lengkap: string;
  };
}

interface UnverifiedShipmentData {
  id: number;
  no_spk_manual: string;
  nama_artikel_manual: string;
  warna_manual: string;
  nama_customer_manual: string;
  quantity: number;
  jumlah_kemasan: number;
  jenis_kemasan: string;
  no_mesin: string;
  catatan: string;
  status: string;
  waktu_kirim: string;
}

export default function DashboardPage() {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [unverifiedShipments, setUnverifiedShipments] = useState<
    UnverifiedShipmentData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"RESMI" | "BOOKING">("RESMI");

  // 🌟 SINKRONISASI ROLE & USER ID
  const [userRole, setUserRole] = useState<string>("");
  const [namaAdmin, setNamaAdmin] = useState("Admin PPIC");

  const [stats, setStats] = useState({
    total: 0,
    wip: 0,
    selesai: 0,
    booking: 0,
  });

  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem("protrack_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchDashboardData = async () => {
    try {
      const [resShipments, resUnverified] = await Promise.all([
        fetch("http://127.0.0.1:8000/shipments/", { headers: getAuthHeader() }),
        fetch("http://127.0.0.1:8000/shipments/unverified-shipments/", {
          headers: getAuthHeader(),
        }),
      ]);

      if (
        resShipments.status === 401 ||
        resShipments.status === 403 ||
        resUnverified.status === 401 ||
        resUnverified.status === 403
      ) {
        Swal.fire(
          "Akses Ditolak / Sesi Berakhir",
          "Sesi Anda tidak valid atau Anda tidak memiliki hak akses untuk halaman ini.",
          "warning",
        ).then(() => {
          localStorage.removeItem("protrack_token");
          localStorage.removeItem("protrack_user");
          window.location.href = "/";
        });
        return;
      }

      if (!resShipments.ok || !resUnverified.ok)
        throw new Error("Gagal memuat data server");

      const dataShipments: ShipmentData[] = await resShipments.json();
      const dataUnverified: UnverifiedShipmentData[] =
        await resUnverified.json();

      setShipments(dataShipments);
      setUnverifiedShipments(dataUnverified);

      setStats({
        total: dataShipments.length,
        wip: dataShipments.filter((s) => s.status === "dikirim").length,
        selesai: dataShipments.filter((s) => s.status === "diterima").length,
        booking: dataUnverified.length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("protrack_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.nama_lengkap) setNamaAdmin(user.nama_lengkap);
        if (user.role) setUserRole(user.role);
      } catch (e) {
        console.error("Gagal memuat profil pengguna", e);
      }
    }

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleValidasiSPK = async (idBooking: number, spkTara: string) => {
    const { value: noSpkInput } = await Swal.fire({
      title: "Tautkan SPK Resmi PPIC",
      text: `Menugaskan nomor dokumen resmi untuk kiriman sementara: ${spkTara}`,
      input: "text",
      inputPlaceholder: "Ketik SPK-XXXXX di sini...",
      showCancelButton: true,
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sinkronisasikan Sekarang",
      inputValidator: (value) => {
        if (!value) return "Nomor SPK resmi wajib diisi!";
      },
    });

    if (noSpkInput) {
      Swal.fire({
        title: "Memproses Validasi...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
      });

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/shipments/unverified-shipments/${idBooking}/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeader(),
            },
            body: JSON.stringify({ no_spk_resmi: noSpkInput }),
          },
        );

        const result = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Data Tersinkronisasi!",
            text: result.message,
            confirmButtonColor: "#10b981",
          });
          fetchDashboardData();
        } else {
          Swal.fire({
            icon: "error",
            title: "Sinkronisasi Gagal",
            text: result.detail || "Terjadi kesalahan sistem.",
            confirmButtonColor: "#ef4444",
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Koneksi Terputus",
          text: "Tidak dapat menghubungi server backend.",
        });
      }
    }
  };

  const filteredResmi = shipments.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.order?.no_spk?.toLowerCase() || "").includes(q) ||
      (item.order?.nama_artikel?.toLowerCase() || "").includes(q)
    );
  });

  const filteredBooking = unverifiedShipments.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.no_spk_manual.toLowerCase().includes(q) ||
      item.nama_artikel_manual.toLowerCase().includes(q)
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
    } catch (e) {
      return "-";
    }
  };

  const handleCetakArsip = () => {
    Swal.fire({
      title: "Unduh Rekap Laporan?",
      text: "Sistem akan mengompilasi seluruh riwayat aliran barang hari ini ke dalam dokumen Excel.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Unduh Excel",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Menyiapkan File...",
          didOpen: () => Swal.showLoading(),
          allowOutsideClick: false,
        });

        try {
          const response = await fetch(
            "http://127.0.0.1:8000/shipments/reports/excel",
            {
              headers: getAuthHeader(),
            },
          );

          if (!response.ok) throw new Error("Gagal mengunduh file.");

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "ProTrack_Daily_Manifest.xlsx";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Laporan berhasil diunduh!",
            showConfirmButton: false,
            timer: 2500,
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Akses Ditolak",
            text: "Anda tidak memiliki wewenang untuk mengunduh laporan ini.",
          });
        }
      }
    });
  };

  return (
    <div className="w-full bg-slate-50 font-sans text-slate-900">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800">
              Status Work-In-Process (WIP)
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              Pemantauan logistik real-time perpindahan barang utama produksi
            </p>
          </div>

          <div className="flex gap-3">
            {/* 🌟 HANYA TOMBOL CETAK LAPORAN: Hak akses disamakan antara PPIC & Admin Produksi */}
            {[
              "ppic",
              "admin_produksi",
              "kepala_bagian",
              "kepala_departemen",
              "staff_it",
            ].includes(userRole) && (
              <button
                onClick={handleCetakArsip}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  ></path>
                </svg>
                Rekap Arsip Pengiriman
              </button>
            )}
          </div>
        </div>

        {/* Statistik Row Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Total Transaksi Hari Ini
            </span>
            <span className="text-3xl font-black text-indigo-900">
              {isLoading ? "..." : stats.total}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Sedang Dikirim (WIP)
            </span>
            <span className="text-3xl font-black text-amber-500">
              {isLoading ? "..." : stats.wip}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Selesai Diterima
            </span>
            <span className="text-3xl font-black text-emerald-600">
              {isLoading ? "..." : stats.selesai}
            </span>
          </div>
          <div
            className={`p-5 rounded-2xl shadow-sm border flex flex-col justify-between transition-all ${stats.booking > 0 ? "bg-orange-50 border-orange-200 ring-2 ring-orange-100" : "bg-white border-slate-200"}`}
          >
            <span className="text-orange-700 text-xs font-bold uppercase tracking-wider mb-1">
              Menunggu Validasi PPIC
            </span>
            <span
              className={`text-3xl font-black ${stats.booking > 0 ? "text-orange-600 animate-pulse" : "text-slate-400"}`}
            >
              {isLoading ? "..." : stats.booking}
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 mb-6 gap-2">
          <button
            onClick={() => {
              setActiveTab("RESMI");
              setSearchQuery("");
            }}
            className={`py-3 px-6 text-sm font-black transition-all border-b-4 ${activeTab === "RESMI" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            SPK Resmi Terdaftar ({filteredResmi.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("BOOKING");
              setSearchQuery("");
            }}
            className={`py-3 px-6 text-sm font-black transition-all border-b-4 flex items-center gap-2 ${activeTab === "BOOKING" ? "border-orange-500 text-orange-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Menunggu Validasi PPIC ({filteredBooking.length})
          </button>
        </div>

        {/* Tabel Data Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              {activeTab === "RESMI"
                ? "Riwayat Pergerakan SPK Terkini"
                : "Antrean Barang Booking (Darurat)"}
            </h3>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <svg
                    className="w-4 h-4"
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
                  placeholder="Cari SPK, Artikel, Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                />
              </div>
              <button
                onClick={fetchDashboardData}
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-indigo-600 font-bold px-3 py-2.5 rounded-xl shadow-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            {isLoading ? (
              <div className="p-10 text-center font-semibold text-slate-400">
                Memuat data sinkronisasi...
              </div>
            ) : activeTab === "RESMI" ? (
              <table className="w-full text-left border-collapse min-w-225">
                <thead>
                  <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4 font-bold w-[15%]">No SPK</th>
                    <th className="px-6 py-4 font-bold w-[25%]">
                      Detail Artikel
                    </th>
                    <th className="px-6 py-4 font-bold w-[20%]">
                      Kuantitas & Kemasan
                    </th>
                    <th className="px-6 py-4 font-bold w-[15%]">
                      Mesin / Bagian
                    </th>
                    <th className="px-6 py-4 font-bold w-[10%]">Status</th>
                    <th className="px-6 py-4 font-bold w-[15%]">Waktu</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {filteredResmi.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-indigo-50/50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                    >
                      <td className="px-6 py-4 font-bold text-indigo-600 align-top">
                        {item.order?.no_spk || "N/A"}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="font-semibold text-slate-900">
                          {item.order?.nama_artikel || "Nama Artikel Kosong"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.order?.warna || "-"} | Cust:{" "}
                          {item.order?.nama_customer || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="font-bold text-slate-900">
                          {item.quantity}{" "}
                          <span className="font-normal text-slate-500">Kg</span>
                        </div>
                        <div className="text-xs font-bold text-indigo-500 capitalize mt-0.5">
                          {item.jumlah_kemasan}{" "}
                          {item.jenis_kemasan ? item.jenis_kemasan : "Box"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium align-top">
                        <div className="text-slate-800 font-bold">
                          MC-{item.no_mesin}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        {item.status === "dikirim" && (
                          <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-md text-xs font-bold inline-block">
                            DIKIRIM
                          </span>
                        )}
                        {item.status === "diterima" && (
                          <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-md text-xs font-bold inline-block">
                            DITERIMA
                          </span>
                        )}
                        {item.status === "bermasalah" && (
                          <span className="bg-rose-100 text-rose-800 px-3 py-1.5 rounded-md text-xs font-bold inline-block">
                            BERMASALAH
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs align-top">
                        <div className="mb-1.5 flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Berangkat:
                          </span>
                          <span className="font-bold text-slate-700">
                            {formatWaktu(item.waktu_kirim)}
                          </span>
                          <span className="text-slate-500 font-medium">
                            Oleh: {item.pengirim?.nama_lengkap || "-"}
                          </span>
                        </div>

                        {item.status === "diterima" && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                              Tiba & Dikonfirmasi:
                            </span>
                            <span className="font-bold text-emerald-700">
                              {formatWaktu(item.waktu_terima)}
                            </span>
                            <span className="text-emerald-600/80 font-bold">
                              Oleh: {item.penerima?.nama_lengkap || "Sistem"}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredResmi.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-10 text-center text-slate-400 font-bold"
                      >
                        Data tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse min-w-225">
                <thead>
                  <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4 font-bold w-[15%]">
                      ID Input Manual
                    </th>
                    <th className="px-6 py-4 font-bold w-[30%]">
                      Detail Artikel Sementara
                    </th>
                    <th className="px-6 py-4 font-bold w-[20%]">
                      Kuantitas & Kemasan
                    </th>
                    <th className="px-6 py-4 font-bold w-[15%]">
                      Mesin / Bagian
                    </th>
                    <th className="px-6 py-4 font-bold w-[20%]">
                      Waktu Dikirim
                    </th>

                    {/* 🌟 TINDAKAN VALIDASI: PPIC dan Admin Produksi kini memiliki akses setara */}
                    {["ppic", "admin_produksi", "staff_it"].includes(
                      userRole,
                    ) && (
                      <th className="px-6 py-4 font-bold text-center w-[20%]">
                        Tindakan Validasi
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {filteredBooking.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-orange-50/50 bg-orange-50/10"
                    >
                      <td className="px-6 py-4 align-top">
                        <span className="bg-orange-500 text-white text-xs font-black px-2 py-1 rounded shadow-sm">
                          {item.no_spk_manual}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="font-bold text-slate-800">
                          {item.nama_artikel_manual}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Warna: {item.warna_manual || "-"} | Cust:{" "}
                          {item.nama_customer_manual || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="font-bold text-slate-800">
                          {item.quantity} Kg
                        </div>
                        <span className="block text-xs text-orange-600 font-bold capitalize mt-0.5">
                          {item.jumlah_kemasan} {item.jenis_kemasan || "Wadah"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-600 align-top">
                        MC-{item.no_mesin}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium align-top">
                        {formatWaktu(item.waktu_kirim)}
                      </td>

                      {/* 🌟 SETARA VALIDASI: Tombol Tautkan SPK resmi bisa dieksekusi PPIC maupun Admin Produksi */}
                      {["ppic", "admin_produksi", "staff_it"].includes(
                        userRole,
                      ) && (
                        <td className="px-6 py-4 text-center align-top">
                          <button
                            onClick={() =>
                              handleValidasiSPK(item.id, item.no_spk_manual)
                            }
                            className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 mx-auto"
                          >
                            TAUTKAN SPK RESMI
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredBooking.length === 0 && (
                    <tr>
                      <td
                        colSpan={
                          ["ppic", "admin_produksi", "staff_it"].includes(
                            userRole,
                          )
                            ? 6
                            : 5
                        }
                        className="p-10 text-center text-slate-400 font-bold"
                      >
                        Lantai produksi bersih! Tidak ada barang darurat yang
                        mengantre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
