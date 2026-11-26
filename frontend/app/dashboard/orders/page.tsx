"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

interface OrderMasterData {
  id: number;
  no_spk: string;
  no_so: string;
  nama_customer: string;
  nama_artikel: string;
  warna: string;
  total_order_qty: number | null;
  catatan: string | null;
  created_at: string;
}

export default function MasterOrdersPage() {
  const [orders, setOrders] = useState<OrderMasterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState("");

  // State untuk kontrol Modal & Form Input SPK
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSpk, setFormSpk] = useState({
    no_spk: "",
    no_so: "",
    nama_customer: "",
    nama_artikel: "",
    warna: "",
    total_order_qty: 0,
    catatan: "",
  });

  const canCreateOrder = ["ppic", "admin_produksi", "staff_it"].includes(
    userRole,
  );

  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem("protrack_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOrdersData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/orders/", {
        headers: getAuthHeader(),
      });

      if (response.status === 401 || response.status === 403) {
        Swal.fire(
          "Sesi Berakhir",
          "Silakan login kembali untuk mengakses Master SPK.",
          "warning",
        ).then(() => {
          localStorage.removeItem("protrack_token");
          localStorage.removeItem("protrack_user");
          window.location.href = "/";
        });
        return;
      }

      if (!response.ok) throw new Error("Gagal mengambil data master");

      const data: OrderMasterData[] = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat",
        text: "Tidak dapat terhubung ke data master order server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const userStr = localStorage.getItem("protrack_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role) setUserRole(user.role);
        } catch {
          // abaikan error parse
        }
      }
      await fetchOrdersData();
    };
    void init();
  }, [fetchOrdersData]);

  const handleSubmitSpk = async (e: React.FormEvent) => {
    e.preventDefault();
    Swal.fire({
      title: "Menyimpan SPK...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    try {
      const response = await fetch("http://127.0.0.1:8000/orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(formSpk),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Dokumen SPK Resmi berhasil disimpan ke Database.",
          confirmButtonColor: "#4f46e5",
        });
        setIsModalOpen(false);
        setFormSpk({
          no_spk: "",
          no_so: "",
          nama_customer: "",
          nama_artikel: "",
          warna: "",
          total_order_qty: 0,
          catatan: "",
        });
        fetchOrdersData(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan",
          text: result.detail || "Terjadi kesalahan.",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Koneksi Gagal",
        text: "Tidak dapat terhubung ke server backend.",
      });
    }
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    return (
      order.no_spk.toLowerCase().includes(q) ||
      order.nama_artikel.toLowerCase().includes(q) ||
      order.nama_customer.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header Panel */}
      <header className="bg-indigo-900 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="bg-indigo-800 p-2 rounded-lg hover:bg-indigo-700 transition"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
            </Link>
            <h1 className="text-xl font-bold tracking-tight">
              Master Database SPK Resmi
            </h1>
          </div>
          <span className="text-xs font-semibold bg-indigo-800 text-indigo-200 px-3 py-1.5 rounded-full uppercase">
            Arsip Pusat PPIC
          </span>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">
              Daftar Komitmen Kontrak Kerja
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Informasi spesification teknis kain karet orders terdaftar pabrik
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
                placeholder="Cari SPK, Produk, Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 shadow-sm"
              />
            </div>

            {canCreateOrder && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
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
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
                Tambah SPK Baru
              </button>
            )}
          </div>
        </div>

        {/* Tabel Data Master */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 font-semibold">
                Menghubungkan ke pusat data master...
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">No SPK resmi</th>
                    <th className="px-6 py-4 font-bold">No SO / Sales Order</th>
                    <th className="px-6 py-4 font-bold">Nama Customer</th>
                    <th className="px-6 py-4 font-bold">Detail Artikel</th>
                    <th className="px-6 py-4 font-bold">Warna</th>
                    <th className="px-6 py-4 font-bold text-right">
                      Target Kebutuhan (Kg)
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-black text-indigo-600">
                        {order.no_spk}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {order.no_so}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {order.nama_customer}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {order.nama_artikel}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md text-xs uppercase border border-slate-200">
                          {order.warna}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900 text-right text-base">
                        {(order.total_order_qty ?? 0).toLocaleString("id-ID")}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          Kg
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-10 text-center text-slate-400 font-bold"
                      >
                        Data Master SPK tidak ditemukan atau belum diinput oleh
                        PPIC.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal Form Input SPK */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-xl p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-slate-800">
                  Formulir Input SPK Resmi PPIC
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitSpk} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Nomor SPK
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: SPK-24001"
                      value={formSpk.no_spk}
                      onChange={(e) =>
                        setFormSpk({ ...formSpk, no_spk: e.target.value })
                      }
                      className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Nomor SO (Sales Order)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: SO-9812"
                      value={formSpk.no_so}
                      onChange={(e) =>
                        setFormSpk({ ...formSpk, no_so: e.target.value })
                      }
                      className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Nama Customer / Perusahaan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT. Sumber Maju"
                    value={formSpk.nama_customer}
                    onChange={(e) =>
                      setFormSpk({ ...formSpk, nama_customer: e.target.value })
                    }
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Nama Artikel / Produk
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Elastic Webbing 2cm"
                    value={formSpk.nama_artikel}
                    onChange={(e) =>
                      setFormSpk({ ...formSpk, nama_artikel: e.target.value })
                    }
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Warna
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Hitam / Putih"
                      value={formSpk.warna}
                      onChange={(e) =>
                        setFormSpk({ ...formSpk, warna: e.target.value })
                      }
                      className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Total Kuantitas Order (Kg)
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="0.00"
                      value={formSpk.total_order_qty || ""}
                      onChange={(e) =>
                        setFormSpk({
                          ...formSpk,
                          total_order_qty: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Catatan PPIC (Opsional)
                  </label>
                  <textarea
                    placeholder="Tambahkan instruksi khusus di sini..."
                    value={formSpk.catatan}
                    onChange={(e) =>
                      setFormSpk({ ...formSpk, catatan: e.target.value })
                    }
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none text-slate-800 focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
                  >
                    Simpan Dokumen SPK
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
