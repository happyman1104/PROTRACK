"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface UserRecord {
  id: number;
  username: string;
  nama_lengkap: string;
  role: string;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: "operator", label: "Operator Lapangan" },
  { value: "admin_produksi", label: "Admin Produksi" },
  { value: "ppic", label: "Staff PPIC" },
  { value: "kepala_bagian", label: "Kepala Bagian" },
  { value: "kepala_departemen", label: "Kepala Departemen" },
  { value: "staff_it", label: "Staff IT" },
];

export default function SystemSettingsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    nama_lengkap: "",
    password: "",
    role: "operator",
  });

  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem("protrack_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setIsLoading(true);
      try {
        const response = await fetch("http://127.0.0.1:8000/users/", {
          headers: getAuthHeader(),
        });

        if (response.status === 401 || response.status === 403) {
          Swal.fire(
            "Akses Ditolak",
            "Halaman konfigurasi sistem hanya dapat diakses oleh Staff IT.",
            "warning",
          ).then(() => router.replace("/dashboard"));
          return;
        }

        if (!response.ok) throw new Error("Gagal mengambil daftar user");

        const data: UserRecord[] = await response.json();
        setUsers(data);
      } catch (error) {
        console.error(error);
        Swal.fire(
          "Gagal Memuat",
          "Tidak dapat terhubung ke server backend.",
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const init = async () => {
      const userStr = localStorage.getItem("protrack_user");
      if (!userStr) {
        router.replace("/");
        return;
      }

      try {
        const parsed = JSON.parse(userStr);
        if (parsed.role !== "staff_it") {
          router.replace("/dashboard");
          return;
        }
        setCurrentUserId(parsed.id ?? null);
        await fetchUsers();
      } catch {
        router.replace("/");
      }
    };
    void init();
  }, [router, fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newUser.username.trim().length < 4 || /\s/.test(newUser.username)) {
      Swal.fire(
        "Validasi Gagal",
        "Username minimal 4 karakter dan tidak boleh mengandung spasi.",
        "warning",
      );
      return;
    }
    if (newUser.nama_lengkap.trim().length < 3) {
      Swal.fire("Validasi Gagal", "Nama lengkap minimal 3 karakter.", "warning");
      return;
    }
    if (newUser.password.length < 6) {
      Swal.fire("Validasi Gagal", "Password minimal 6 karakter.", "warning");
      return;
    }

    Swal.fire({
      title: "Membuat Akun...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    try {
      const response = await fetch("http://127.0.0.1:8000/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          username: newUser.username.trim(),
          nama_lengkap: newUser.nama_lengkap.trim(),
          password: newUser.password,
          role: newUser.role,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Akun Dibuat",
          text: `User '${result.username}' berhasil didaftarkan sebagai ${result.role.replace("_", " ")}.`,
          confirmButtonColor: "#4f46e5",
        });
        setIsModalOpen(false);
        setNewUser({
          username: "",
          nama_lengkap: "",
          password: "",
          role: "operator",
        });
        fetchUsers();
      } else {
        const detailMsg = Array.isArray(result.detail)
          ? result.detail[0]?.msg || "Input tidak valid."
          : result.detail || "Gagal membuat user.";
        Swal.fire("Gagal", detailMsg, "error");
      }
    } catch {
      Swal.fire("Error", "Tidak dapat terhubung ke server backend.", "error");
    }
  };

  const handleRoleChange = async (targetUser: UserRecord, nextRole: string) => {
    if (targetUser.role === nextRole) return;

    const confirm = await Swal.fire({
      title: "Ubah Hak Akses?",
      text: `Ubah role '${targetUser.username}' menjadi ${nextRole.replace("_", " ").toUpperCase()}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Ubah",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/users/${targetUser.id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({ role: nextRole }),
        },
      );

      const result = await response.json();
      if (response.ok) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Role berhasil diperbarui",
          showConfirmButton: false,
          timer: 2000,
        });
        fetchUsers();
      } else {
        Swal.fire("Gagal", result.detail || "Gagal mengubah role.", "error");
      }
    } catch {
      Swal.fire("Error", "Tidak dapat terhubung ke server.", "error");
    }
  };

  const handleDeleteUser = async (targetUser: UserRecord) => {
    const confirm = await Swal.fire({
      title: "Hapus Akun?",
      text: `Akun '${targetUser.username}' (${targetUser.nama_lengkap}) akan dihapus secara permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/users/${targetUser.id}`,
        {
          method: "DELETE",
          headers: getAuthHeader(),
        },
      );

      const result = await response.json();
      if (response.ok) {
        Swal.fire("Berhasil", result.message, "success");
        fetchUsers();
      } else {
        Swal.fire("Gagal", result.detail || "Gagal menghapus akun.", "error");
      }
    } catch {
      Swal.fire("Error", "Tidak dapat terhubung ke server.", "error");
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.nama_lengkap.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const formatTanggal = (iso?: string) => {
    if (!iso) return "-";
    const parsed = new Date(iso.includes(" ") ? iso.replace(" ", "T") : iso);
    if (isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">
            Konfigurasi Sistem &amp; Role
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Manajemen akun pengguna dan pembagian hak akses ProTrack (Khusus
            Staff IT)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-95 text-sm"
        >
          + Tambah Akun User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <h3 className="font-bold text-slate-800">
            Daftar Pengguna Terdaftar ({filteredUsers.length})
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari username, nama, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={() => fetchUsers(true)}
              className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-indigo-600 font-bold px-3 py-2.5 rounded-xl"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center font-semibold text-slate-400">
              Memuat daftar pengguna...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 font-bold">ID</th>
                  <th className="px-6 py-4 font-bold">Username</th>
                  <th className="px-6 py-4 font-bold">Nama Lengkap</th>
                  <th className="px-6 py-4 font-bold">Hak Akses (Role)</th>
                  <th className="px-6 py-4 font-bold">Terdaftar</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        #{u.id}
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-700">
                        {u.username}
                        {isSelf && (
                          <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                            Anda
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {u.nama_lengkap}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatTanggal(u.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={isSelf}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-slate-400 font-bold"
                    >
                      Tidak ada pengguna yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-extrabold text-slate-800">
                Tambah Pengguna Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={newUser.nama_lengkap}
                  onChange={(e) =>
                    setNewUser({ ...newUser, nama_lengkap: e.target.value })
                  }
                  placeholder="Contoh: Siti Rahmawati"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Username (tanpa spasi)
                </label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  placeholder="Contoh: siti_ppic"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Password (minimal 6 karakter)
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Hak Akses (Role)
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
