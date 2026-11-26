"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ALLOWED_OPERATOR_ROLES = ["operator", "admin_produksi", "staff_it"];

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("protrack_user");
    const token = localStorage.getItem("protrack_token");

    if (!userStr || !token) {
      router.replace("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);
      if (!ALLOWED_OPERATOR_ROLES.includes(parsedUser.role)) {
        router.replace("/dashboard");
        return;
      }
      queueMicrotask(() => setIsAuthorized(true));
    } catch {
      localStorage.removeItem("protrack_user");
      localStorage.removeItem("protrack_token");
      router.replace("/");
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
