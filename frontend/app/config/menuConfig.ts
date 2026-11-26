// frontend/app/config/menuConfig.ts

export interface MenuItem {
  title: string;
  path: string;
  icon: string;
  allowedRoles: string[]; // Menyimpan role mana saja yang boleh melihat menu ini
}

export const dashboardMenuConfig: MenuItem[] = [
  {
    title: "Ringkasan Dashboard",
    path: "/dashboard",
    icon: "DashboardIcon",
    allowedRoles: [
      "admin_produksi",
      "ppic",
      "kepala_bagian",
      "kepala_departemen",
      "staff_it",
    ], // Semua non-operator
  },
  {
    title: "Manajemen SPK (Orders)",
    path: "/dashboard/orders",
    icon: "OrdersIcon",
    allowedRoles: [
      "admin_produksi",
      "ppic",
      "kepala_bagian",
      "kepala_departemen",
      "staff_it",
    ],
  },
  {
    title: "Konfigurasi Sistem & Role",
    path: "/dashboard/settings",
    icon: "SettingsIcon",
    allowedRoles: ["staff_it"], // Eksklusif hanya untuk Staff IT (Herman)
  },
];
