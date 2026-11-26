"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function LandingAndAuthPage() {
  const router = useRouter();

  const [isChecking, setIsChecking] = useState(true);
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    namaLengkap: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "operator",
  });

  useEffect(() => {
    const userStr = localStorage.getItem("protrack_user");
    const token = localStorage.getItem("protrack_token");
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "operator") {
          router.push("/operator");
        } else {
          router.push("/dashboard");
        }
      } catch {
        localStorage.removeItem("protrack_user");
        localStorage.removeItem("protrack_token");
        queueMicrotask(() => setIsChecking(false));
      }
    } else {
      queueMicrotask(() => setIsChecking(false));
    }
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoginView) {
      if (formData.namaLengkap.trim().length < 3) {
        Swal.fire("Error", "Nama Lengkap minimal 3 karakter.", "error");
        return;
      }
      if (formData.username.trim().length < 4 || /\s/.test(formData.username)) {
        Swal.fire(
          "Error",
          "Username minimal 4 karakter dan tidak boleh mengandung spasi!",
          "error",
        );
        return;
      }
      if (formData.password.length < 6) {
        Swal.fire("Error", "Password minimal 6 karakter!", "error");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        Swal.fire("Error", "Kata sandi tidak cocok!", "error");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLoginView) {
        const response = await fetch("http://127.0.0.1:8000/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          Swal.fire(
            "Login Gagal",
            errorData.detail || "Kredensial salah.",
            "error",
          );
          setIsLoading(false);
          return;
        }

        const userData = await response.json();
        localStorage.setItem("protrack_token", userData.access_token);
        localStorage.setItem("protrack_user", JSON.stringify(userData.user));

        Swal.fire({
          icon: "success",
          title: "Akses Diberikan",
          text: `Selamat datang, ${userData.user.nama_lengkap || formData.username}!`,
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          if (userData.user.role === "operator") {
            router.push("/operator");
          } else {
            router.push("/dashboard");
          }
        });
      } else {
        const response = await fetch("http://127.0.0.1:8000/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username.trim(),
            password: formData.password,
            nama_lengkap: formData.namaLengkap.trim(),
          }),
        });

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Akun Operator berhasil dibuat! Silakan login.",
          });
          setFormData({ ...formData, password: "", confirmPassword: "" });
          setIsLoginView(true);
        } else {
          const data = await response.json();
          const detailMsg = Array.isArray(data.detail)
            ? data.detail[0]?.msg || "Input tidak valid."
            : data.detail || "Kesalahan sistem.";
          Swal.fire("Gagal", detailMsg, "error");
        }
      }
    } catch {
      Swal.fire("Error", "Server tidak merespon.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    // 🌟 KONTROL LAYAR UTAMA: Diubah ke min-h-screen agar responsif menampung layout memanjang ke bawah
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between font-sans text-slate-800">
      {/* 🌟 KOTAK TENGAH: Memakai w-full dan max-w-5xl */}
      <main className="flex-1 w-full flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden border border-slate-200 min-h-125 max-h-[90vh]">
          {/* ================= BAGIAN KIRI: INFORMASI ================= */}
          <div className="w-full md:w-1/2 p-6 md:p-8 bg-slate-50 border-r border-slate-100 flex flex-col justify-center overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
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
                  ></path>
                </svg>
              </div>
              <h1 className="text-xl font-black text-slate-800">ProTrack</h1>
            </div>
            <p className="text-slate-500 text-xs mb-4 font-medium">
              Sistem Digitalisasi Logistik Terpadu
            </p>

            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">
              Solusi Digital Monitoring WIP
            </h2>
            <p className="text-slate-600 text-xs mb-5 font-medium">
              Alur operasional PT Gajah Putih Elastic:
            </p>

            {/* Kotak Langkah 1-3 */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 text-center">
                <div className="flex justify-center text-indigo-500 mb-1">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                </div>
                <h4 className="font-bold text-xs text-slate-800">1. Input</h4>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 text-center">
                <div className="flex justify-center text-indigo-500 mb-1">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    ></path>
                  </svg>
                </div>
                <h4 className="font-bold text-xs text-slate-800">2. Scan</h4>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 text-center">
                <div className="flex justify-center text-indigo-500 mb-1">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    ></path>
                  </svg>
                </div>
                <h4 className="font-bold text-xs text-slate-800">3. Monitor</h4>
              </div>
            </div>

            {/* Kotak Langkah 4-5 */}
            <div className="grid grid-cols-2 gap-2 mb-6 max-w-xs mx-auto w-full">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 text-center">
                <div className="flex justify-center text-emerald-500 mb-1">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M5 13l4 4L19 7"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    ></path>
                  </svg>
                </div>
                <h4 className="font-bold text-xs text-slate-800">4. Terima</h4>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 text-center">
                <div className="flex justify-center text-green-600 mb-1">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                </div>
                <h4 className="font-bold text-xs text-slate-800">5. Report</h4>
              </div>
            </div>
          </div>

          {/* ================= BAGIAN KANAN: FORM ================= */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white overflow-y-auto">
            <div className="bg-slate-100 rounded-md p-1 flex relative mb-5 shrink-0">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-600 rounded shadow transition-all duration-300 ${isLoginView ? "left-1" : "left-[calc(50%+3px)]"}`}
              ></div>
              <button
                onClick={() => {
                  setIsLoginView(true);
                  setFormData({
                    ...formData,
                    password: "",
                    confirmPassword: "",
                  });
                }}
                className={`flex-1 text-xs font-bold py-2 z-10 ${isLoginView ? "text-white" : "text-slate-500"}`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setIsLoginView(false);
                  setFormData({
                    ...formData,
                    password: "",
                    confirmPassword: "",
                  });
                }}
                className={`flex-1 text-xs font-bold py-2 z-10 ${!isLoginView ? "text-white" : "text-slate-500"}`}
              >
                Register
              </button>
            </div>

            <div className="mb-4 shrink-0">
              <h2 className="text-xl font-black text-slate-800 mb-1">
                Akses Sistem WIP
              </h2>
              <p className="text-slate-500 text-xs font-medium">
                {isLoginView
                  ? "Silakan masuk ke akun Anda."
                  : "Bergabung & digitalisasi WIP Anda."}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
              {!isLoginView && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="namaLengkap"
                    placeholder="Budi Susanto"
                    required={!isLoginView}
                    value={formData.namaLengkap}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Username ID
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="budi_op"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Password
                  </label>
                  {isLoginView && (
                    <button
                      type="button"
                      onClick={() =>
                        Swal.fire({
                          icon: "info",
                          title: "Lupa?",
                          text: "Hubungi Admin.",
                          confirmButtonColor: "#4f46e5",
                        })
                      }
                      className="text-xs font-bold text-indigo-600"
                    >
                      Lupa?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showPassword ? (
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    ) : (
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
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {!isLoginView && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Konfirmasi Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      required={!isLoginView}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 text-xs text-indigo-800 font-medium">
                    Pendaftaran mandiri otomatis diberikan hak akses{" "}
                    <span className="font-bold">Operator Lapangan</span>. Untuk
                    role PPIC, Manajemen, atau IT, hubungi Staff IT.
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : null}
                {isLoginView ? "Masuk Panel" : "Daftarkan Akun"}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* 🌟 FOOTER BARU: Mengikuti gaya draf memanjang penuh, warna latar biru dongker tua, teks putih tebal */}
      <footer className="w-full bg-indigo-600 py-4 text-center border-t border-indigo-600 shadow-md">
        <p className="text-xs font-bold text-white uppercase tracking-widest px-4">
          &copy; {new Date().getFullYear()} by PT. GAJAH PUTIH ELASTIC
        </p>
      </footer>
    </div>
  );
}
