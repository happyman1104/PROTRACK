// frontend/app/dashboard/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { dashboardMenuConfig } from "../config/menuConfig";
import Swal from "sweetalert2";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<{
    username: string;
    nama_lengkap: string;
    role: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("protrack_user");
    const token = localStorage.getItem("protrack_token");

    if (!userStr || !token) {
      // Proteksi Lapis 1: Jika tidak ada token/user, tendang ke login page
      router.push("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);

      // Proteksi Lapis 2: Jika yang mencoba masuk adalah operator, alihkan ke /operator
      if (parsedUser.role === "operator") {
        router.push("/operator");
        return;
      }

      setUser(parsedUser);
    } catch (error) {
      localStorage.clear();
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    Swal.fire({
      title: "Keluar?",
      text: "Anda harus login kembali untuk mengakses data.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Keluar",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("protrack_user");
        localStorage.removeItem("protrack_token");
        router.push("/");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  // 🌟 SINKRONISASI UTAMA: Filter menu berdasarkan role user yang sedang aktif
  const allowedMenus = dashboardMenuConfig.filter((menu) =>
    user ? menu.allowedRoles.includes(user.role) : false,
  );

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      {/* ================= SIDEBAR UI ================= */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shadow-xl shrink-0">
        <div>
          {/* Header Sidebar */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded text-white">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-wide">
                ProTrack
              </h1>
              <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
                GP Elastic Panel
              </p>
            </div>
          </div>

          {/* Info Logged In User */}
          <div className="px-5 py-4 bg-slate-950/40 border-b border-slate-800/50">
            <p className="text-xs text-slate-400">Selamat datang,</p>
            <h3 className="text-sm font-bold text-slate-200 truncate">
              {user?.nama_lengkap}
            </h3>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-extrabold text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 rounded-md uppercase tracking-wider">
              {user?.role.replace("_", " ")}
            </span>
          </div>

          {/* Dinamis Menu Items (Ter-filter otomatis & bersih dari menu sampah) */}
          <nav className="p-4 space-y-1.5">
            {allowedMenus.map((menu) => {
              const isActive = pathname === menu.path;
              return (
                <Link
                  key={menu.path}
                  href={menu.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span>{menu.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar / Tombol Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white text-xs font-bold rounded-lg transition-all"
          >
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar mini */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
            {pathname === "/dashboard"
              ? "Overview WIP"
              : pathname.split("/").pop()?.replace("-", " ")}
          </h2>
          <div className="text-xs font-medium text-slate-500">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </header>

        {/* Area Render Halaman */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
