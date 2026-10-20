import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { CustomerLoginButton } from "./button";

async function LoginContent() {
  await connection();
  const enabled = process.env.LINE_LOGIN_ENABLED === "true";
  const session =
    enabled && process.env.DATABASE_URL && process.env.CUSTOMER_AUTH_SECRET
      ? await auth()
      : null;

  return (
    <main>
      <h1>고객 로그인</h1>
      {enabled ? (
        <CustomerLoginButton signedIn={Boolean(session?.user)} />
      ) : (
        <p>LINE 로그인이 준비되지 않았습니다.</p>
      )}
      <p>로그인에는 LINE 프로필 권한만 사용하며 이메일은 요청하지 않습니다.</p>
      <p>
        <Link href="/">홈으로 돌아가기</Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main>로그인 상태를 확인하고 있습니다.</main>}>
      <LoginContent />
    </Suspense>
  );
}
