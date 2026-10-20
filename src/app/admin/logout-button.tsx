"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminAuthClient } from "@/lib/admin-auth-client";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await adminAuthClient.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} disabled={pending}>
      {pending ? "로그아웃 중…" : "관리자 로그아웃"}
    </button>
  );
}
