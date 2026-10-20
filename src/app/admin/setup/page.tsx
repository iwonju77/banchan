import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminTotpSetupForm } from "./form";
import { getAdminSession } from "@/lib/admin-session";

async function AdminSetupContent() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.user.twoFactorEnabled) redirect("/admin");

  return (
    <main>
      <h1>관리자 2단계 인증 설정</h1>
      <p>관리자 화면을 사용하기 전에 TOTP 인증 앱과 복구 코드를 설정해야 합니다.</p>
      <AdminTotpSetupForm />
    </main>
  );
}

export default function AdminSetupPage() {
  return (
    <Suspense fallback={<main>관리자 인증을 확인하고 있습니다.</main>}>
      <AdminSetupContent />
    </Suspense>
  );
}
