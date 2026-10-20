import Link from "next/link";
import { AdminVerifyForm } from "./form";

export default function AdminVerifyPage() {
  return (
    <main>
      <h1>관리자 2단계 인증</h1>
      <p>인증 앱 코드 또는 사용하지 않은 복구 코드를 입력해 주세요.</p>
      <AdminVerifyForm />
      <p>
        <Link href="/admin/login">로그인으로 돌아가기</Link>
      </p>
    </main>
  );
}
