"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface ItemAntrean {
  id_temp: number;
  order_id: number | null;
  tanggal: string;
  no_spk: string;
  artikel: string;
  warna: string;
  customer: string;
  no_so: string;
  quantity: number;
  jumlah_kemasan: number;
  jenis_kemasan: string;
  no_mesin: string;
  produksi: string;
  catatan: string;
  is_manual: boolean;
}

const getTodayDateString = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().split("T")[0];
};

export default function FormKirimBarang() {
  const router = useRouter();

  const [tanggal, setTanggal] = useState(getTodayDateString);
  const [noSpk, setNoSpk] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);

  const [qty, setQty] = useState("");
  const [kemasan, setKemasan] = useState("1");
  const [jenisKemasan, setJenisKemasan] = useState("box");
  const [noSo, setNoSo] = useState("");
  const [customer, setCustomer] = useState("");
  const [article, setArticle] = useState("");
  const [colour, setColour] = useState("");
  const [noMc, setNoMc] = useState("");
  const [produksi, setProduksi] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [antrean, setAntrean] = useState<ItemAntrean[]>([]);

  const handleCariSPK = async () => {
    if (!noSpk) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Masukkan Nomor SPK terlebih dahulu!",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    const token = localStorage.getItem("protrack_token");
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Sesi Berakhir",
        text: "Silakan login kembali.",
      }).then(() => {
        localStorage.removeItem("protrack_token");
        localStorage.removeItem("protrack_user");
        router.push("/");
      });
      return;
    }

    setIsSearching(true);
    setOrderId(null);
    setIsManualMode(false);

    try {
      let formatPencarian = noSpk.trim().toUpperCase();
      if (formatPencarian.startsWith("SPK-")) {
        formatPencarian = formatPencarian.replace("SPK-", "");
      }

      setNoSpk(formatPencarian);
      const response = await fetch(
        `http://127.0.0.1:8000/orders/${encodeURIComponent(formatPencarian)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401 || response.status === 403) {
        setIsSearching(false);
        Swal.fire({
          icon: "warning",
          title: "Sesi Berakhir",
          text: "Token login sudah tidak valid. Silakan login kembali.",
        }).then(() => {
          localStorage.removeItem("protrack_token");
          localStorage.removeItem("protrack_user");
          router.push("/");
        });
        return;
      }

      if (!response.ok) {
        setIsSearching(false);
        Swal.fire({
          title: "SPK Belum Terdaftar",
          text: `Nomor ${formatPencarian} tidak ditemukan di sistem. SPK mungkin belum diterbitkan Admin. Apakah Anda ingin menginput data artikel ini secara manual?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#f97316",
          cancelButtonColor: "#64748b",
          confirmButtonText: "Ya, Input Manual",
          cancelButtonText: "Batal",
        }).then((result) => {
          if (result.isConfirmed) {
            setIsManualMode(true);
            setNoSo("-");
            setCustomer("");
            setArticle("");
            setColour("");
            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "info",
              title: "Mode Manual Aktif. Silakan ketik nama artikel.",
              showConfirmButton: false,
              timer: 3000,
            });
          } else {
            setNoSpk("");
          }
        });
        return;
      }

      const data = await response.json();
      if (data.id) setOrderId(data.id);
      setQty(data.quantity ? data.quantity.toString() : "");
      setNoSo(data.no_so || "");
      setCustomer(data.nama_customer || "");
      setArticle(data.nama_artikel || data.artikel || "");
      setColour(data.warna || "");
    } catch {
      Swal.fire({
        icon: "error",
        title: "Koneksi Gagal",
        text: "Tidak dapat terhubung ke server backend.",
        confirmButtonColor: "#f97316",
      });
    }
    setIsSearching(false);
  };

  const handleTambahKeAntrean = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId && !isManualMode) {
      Swal.fire({
        icon: "warning",
        title: "Validasi Diperlukan",
        text: 'Silakan klik tombol "Cari" terlebih dahulu!',
        confirmButtonColor: "#f97316",
      });
      return;
    }

    if (isManualMode && !article) {
      Swal.fire({
        icon: "warning",
        title: "Data Kosong",
        text: "Nama Artikel wajib diisi pada mode manual!",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    const parsedQty = parseFloat(qty);
    const parsedKemasan = parseInt(kemasan, 10);
    if (isNaN(parsedQty) || parsedQty <= 0 || isNaN(parsedKemasan) || parsedKemasan <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Input Tidak Valid",
        text: "Qty (Kg) dan Jumlah Kemasan harus lebih dari 0!",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    const itemBaru: ItemAntrean = {
      id_temp: Date.now(),
      order_id: orderId,
      tanggal: tanggal,
      no_spk: noSpk,
      artikel: article,
      warna: colour,
      customer: customer,
      no_so: noSo,
      quantity: parsedQty,
      jumlah_kemasan: parsedKemasan,
      jenis_kemasan: jenisKemasan,
      no_mesin: noMc,
      produksi: produksi,
      catatan: keterangan,
      is_manual: isManualMode,
    };

    setAntrean([...antrean, itemBaru]);
    setKeterangan("");

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Masuk Antrean",
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const handleHapusItemAntrean = (idTemp: number) => {
    setAntrean(antrean.filter((item) => item.id_temp !== idTemp));
  };

  const handleKirimSemuaDanBuatBon = async () => {
    if (antrean.length === 0) return;

    const userStr = localStorage.getItem("protrack_user");
    const token = localStorage.getItem("protrack_token");
    if (!userStr || !token) {
      Swal.fire({
        icon: "error",
        title: "Sesi Berakhir",
        text: "Anda akan dialihkan ke halaman Login.",
      }).then(() => {
        localStorage.removeItem("protrack_token");
        localStorage.removeItem("protrack_user");
        router.push("/");
      });
      return;
    }

    const konfirmasi = await Swal.fire({
      title: "Kirim & Buat Bon?",
      text: `Anda akan memproses ${antrean.length} kemasan ke database.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Proses Sekarang!",
      cancelButtonText: "Batal",
    });

    if (!konfirmasi.isConfirmed) return;

    setIsSubmitting(true);
    let berhasil = 0;
    let gagal = 0;

    for (const item of antrean) {
      let urlEndpoint = "";
      let payloadData = {};

      // Gabungkan informasi Bagian Produksi & Tanggal Label ke catatan agar tidak hilang
      const catatanLengkap = [
        item.produksi ? `Bagian: ${item.produksi.trim()}` : "",
        item.tanggal ? `Tgl Label: ${item.tanggal}` : "",
        item.catatan ? item.catatan.trim() : "",
      ]
        .filter(Boolean)
        .join(" | ");

      if (item.is_manual) {
        urlEndpoint = "http://127.0.0.1:8000/shipments/unverified-shipments/";
        payloadData = {
          no_spk_manual: item.no_spk,
          nama_artikel_manual: item.artikel,
          warna_manual: item.warna,
          nama_customer_manual: item.customer,
          quantity: item.quantity,
          jumlah_kemasan: item.jumlah_kemasan,
          jenis_kemasan: item.jenis_kemasan,
          no_mesin: item.no_mesin,
          catatan: catatanLengkap,
        };
      } else {
        urlEndpoint = "http://127.0.0.1:8000/shipments/";
        payloadData = {
          order_id: item.order_id,
          quantity: item.quantity,
          jumlah_kemasan: item.jumlah_kemasan,
          jenis_kemasan: item.jenis_kemasan,
          no_mesin: item.no_mesin,
          catatan: catatanLengkap,
        };
      }

      try {
        const response = await fetch(urlEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payloadData),
        });

        if (response.ok) berhasil++;
        else gagal++;
      } catch {
        gagal++;
      }
    }

    setIsSubmitting(false);

    if (gagal === 0) {
      Swal.fire({
        icon: "success",
        title: "Berhasil Memproses!",
        html: `<b>${berhasil} kemasan</b> telah terkirim.<br>Data manual masuk antrean revisi Admin.`,
        confirmButtonColor: "#10b981",
      });

      setAntrean([]);
      setTanggal(getTodayDateString());
      setNoSpk("");
      setOrderId(null);
      setIsManualMode(false);
      setQty("");
      setKemasan("1");
      setJenisKemasan("box");
      setNoSo("");
      setCustomer("");
      setArticle("");
      setColour("");
      setNoMc("");
      setProduksi("");
    } else {
      Swal.fire({
        icon: "warning",
        title: "Selesai dengan Hambatan",
        html: `Berhasil: <b>${berhasil}</b><br>Gagal: <b>${gagal}</b>`,
        confirmButtonColor: "#f59e0b",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col">
        <header className="bg-orange-500 text-white p-4 shadow-md flex items-center gap-4 sticky top-0 z-20">
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
            <h1 className="text-xl font-black tracking-tight">
              Kirim Barang WIP
            </h1>
            <p className="text-xs text-orange-100 font-medium">
              Digitalisasi Logistik Multi-Kemasan
            </p>
          </div>
        </header>

        <main className="p-6 flex-1">
          <form
            onSubmit={handleTambahKeAntrean}
            className="space-y-5 border-b-2 border-dashed border-slate-200 pb-8"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  No. SPK
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noSpk}
                    onChange={(e) => setNoSpk(e.target.value)}
                    placeholder="Contoh: 0526..."
                    className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-black text-indigo-700 uppercase shadow-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleCariSPK}
                    disabled={isSearching}
                    className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:bg-indigo-400 shadow-md transition-all active:scale-95 flex items-center justify-center"
                  >
                    {isSearching ? (
                      "..."
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border transition-all ${isManualMode ? "bg-orange-50 border-orange-300 ring-2 ring-orange-100" : "bg-slate-50 border-slate-200"} space-y-4`}
            >
              {isManualMode && (
                <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 mb-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
                  </svg>
                  MODE INPUT MANUAL AKTIF
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                    Qty (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-xs font-bold text-slate-800"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                    Jml
                  </label>
                  <input
                    type="number"
                    value={kemasan}
                    onChange={(e) => setKemasan(e.target.value)}
                    placeholder="1"
                    className="w-full px-2.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-xs font-bold text-slate-800"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                    Kemasan
                  </label>
                  <select
                    value={jenisKemasan}
                    onChange={(e) => setJenisKemasan(e.target.value)}
                    className="w-full px-1 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="box">Box</option>
                    <option value="karung">Karung</option>
                    <option value="kardus">Kardus</option>
                    <option value="plastik">Plastik</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Customer
                </label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  readOnly={!isManualMode}
                  placeholder="Nama Customer / PT"
                  className={`w-full px-4 py-2.5 border rounded-lg outline-none text-sm font-medium transition-all ${isManualMode ? "bg-white border-orange-300 focus:ring-2 focus:ring-orange-500 text-slate-800" : "bg-gray-100 border-slate-200 text-slate-500 cursor-not-allowed"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Article
                  </label>
                  <input
                    type="text"
                    value={article}
                    onChange={(e) => setArticle(e.target.value)}
                    readOnly={!isManualMode}
                    placeholder="Nama Barang"
                    className={`w-full px-4 py-2.5 border rounded-lg outline-none text-sm font-medium transition-all ${isManualMode ? "bg-white border-orange-300 focus:ring-2 focus:ring-orange-500 text-slate-800" : "bg-gray-100 border-slate-200 text-slate-500 cursor-not-allowed"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Colour
                  </label>
                  <input
                    type="text"
                    value={colour}
                    onChange={(e) => setColour(e.target.value)}
                    readOnly={!isManualMode}
                    placeholder="Warna"
                    className={`w-full px-4 py-2.5 border rounded-lg outline-none text-sm font-medium transition-all ${isManualMode ? "bg-white border-orange-300 focus:ring-2 focus:ring-orange-500 text-slate-800" : "bg-gray-100 border-slate-200 text-slate-500 cursor-not-allowed"}`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  No. MC (Mesin)
                </label>
                <input
                  type="text"
                  value={noMc}
                  onChange={(e) => setNoMc(e.target.value)}
                  placeholder="BK-01"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Prod. (Bagian)
                </label>
                <input
                  type="text"
                  value={produksi}
                  onChange={(e) => setProduksi(e.target.value)}
                  placeholder="Extruder"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium text-slate-800"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-base flex items-center justify-center gap-2"
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
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
              TAMBAH KE ANTREAN
            </button>
          </form>

          {/* Sisa komponen tampilan antrean massal tetap sama */}
          <div className="mt-6">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 mb-4">
              Antrean Kirim ({antrean.length})
            </h3>

            {antrean.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 text-center rounded-2xl">
                <p className="text-sm font-medium text-slate-400">
                  Belum ada kemasan yang di-input.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
                  {antrean.map((item, index) => (
                    <div
                      key={item.id_temp}
                      className={`bg-white border ${item.is_manual ? "border-orange-300" : "border-slate-200"} rounded-xl p-3 shadow-sm flex justify-between items-center`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          <span className="text-sm font-black text-slate-900 truncate">
                            {item.no_spk}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 truncate">
                          {item.artikel} ({item.warna})
                        </p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                          MC: {item.no_mesin} | Wadah:{" "}
                          <span className="text-indigo-600 font-bold capitalize">
                            {item.jumlah_kemasan} {item.jenis_kemasan}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleHapusItemAntrean(item.id_temp)}
                        className="text-slate-400 hover:text-red-500 p-2"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleKirimSemuaDanBuatBon}
                  disabled={isSubmitting}
                  className={`w-full text-white font-black py-4 rounded-xl shadow-md mt-6 transition-all active:scale-95 text-lg flex items-center justify-center gap-2 ${isSubmitting ? "bg-orange-400 cursor-wait" : "bg-orange-500 hover:bg-orange-600"}`}
                >
                  {isSubmitting
                    ? "MEMPROSES..."
                    : `KIRIM BATCH & BUAT BON (${antrean.length})`}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
