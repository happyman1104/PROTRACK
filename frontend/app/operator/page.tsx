"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OperatorPage() {
  const [userName, setUserName] = useState("Memuat...");
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("protrack_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.nama_lengkap || user.username);
    }
  }, []);

  // Fungsi Logout Aman
  const handleLogout = () => {
    localStorage.removeItem("protrack_token");
    localStorage.removeItem("protrack_user");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col">
        {/* Header Section */}
        <header className="bg-indigo-800 text-white p-6 shadow-md rounded-b-4xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight mb-1">
                ProTrack App
              </h1>
              <span className="inline-block bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Operator Aktif
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
            >
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                ></path>
              </svg>
            </button>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-indigo-200 uppercase font-semibold tracking-wider">
              Selamat Bekerja,
            </p>
            <p className="text-lg font-bold truncate">{userName}</p>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 mt-10 flex-1 flex flex-col justify-center">
          <h2 className="text-slate-800 font-black text-lg mb-6 flex items-center gap-2 justify-center">
            <svg
              className="w-5 h-5 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              ></path>
            </svg>
            Menu Aliran Barang WIP
          </h2>

          <div className="space-y-4">
            {/* Tombol Navigasi Manual Kirim */}
            <Link
              href="/operator/kirim"
              className="group w-full bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(249,115,22,0.15)] flex flex-col items-center justify-center transition-all active:scale-[0.98]"
            >
              <div className="bg-white/20 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  ></path>
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight">
                KIRIM BARANG
              </span>
            </Link>

            {/* Tombol Navigasi Manual Terima */}
            <button
              onClick={() => router.push("/operator/terima")}
              className="group w-full bg-emerald-500 hover:bg-emerald-600 text-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(16,185,129,0.15)] flex flex-col items-center justify-center transition-all active:scale-[0.98]"
            >
              <div className="bg-white/20 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  ></path>
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight">
                TERIMA BARANG
              </span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
