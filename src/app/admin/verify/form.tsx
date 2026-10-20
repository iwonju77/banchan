"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminAuthClient } from "@/lib/admin-auth-client";

export function AdminVerifyForm() {
  const router = useRouter();
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function verify(formData: FormData) {
    setPending(true);
    setError(null);
    const code = String(formData.get("code") ?? "").trim();
    try {
      const result = recoveryMode
        ? await adminAuthClient.twoFactor.verifyBackupCode({ code })
        : await adminAuthClient.twoFactor.verifyTotp({ code });
      if (result.error) {
        setError("코드를 확인할 수 없습니다. 다시 시도해 주세요.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("인증 서비스에 연결하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form action={verify}>
        <label>
          {recoveryMode ? "복구 코드" : "인증 앱 코드"}
          <input
            name="code"
            inputMode={recoveryMode ? "text" : "numeric"}
            autoComplete={recoveryMode ? "off" : "one-time-code"}
            pattern={recoveryMode ? undefined : "[0-9]{6}"}
            maxLength={recoveryMode ? 64 : 6}
            required
          />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? "확인 중…" : "확인"}
        </button>
        {error ? <p role="alert">{error}</p> : null}
      </form>
      <button type="button" onClick={() => setRecoveryMode(!recoveryMode)}>
        {recoveryMode ? "인증 앱 코드 사용" : "복구 코드 사용"}
      </button>
    </>
  );
}
