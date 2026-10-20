"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminAuthClient } from "@/lib/admin-auth-client";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await adminAuthClient.signIn.email({
        email: String(formData.get("email") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
      });
      if (result.error) {
        setError("로그인에 실패했습니다. 입력한 정보를 확인해 주세요.");
        return;
      }

      const data = result.data as typeof result.data & {
        twoFactorRedirect?: boolean;
      };
      router.replace(data?.twoFactorRedirect ? "/admin/verify" : "/admin");
    } catch {
      setError("인증 서비스에 연결하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={submit}>
      <label>
        이메일
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        비밀번호
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "확인 중…" : "관리자 로그인"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
