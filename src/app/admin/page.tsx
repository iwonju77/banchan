import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { AdminLogoutButton } from "./logout-button";

async function AdminDashboard() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!session.user.twoFactorEnabled) redirect("/admin/setup");

  return (
    <main>
      <h1>오늘반찬 관리자</h1>
      <p>관리자 인증과 2단계 인증이 완료되었습니다.</p>
      <p>관리 계정: {session.user.email}</p>
      <AdminLogoutButton />
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<main>관리자 인증을 확인하고 있습니다.</main>}>
      <AdminDashboard />
    </Suspense>
  );
}
