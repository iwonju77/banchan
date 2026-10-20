"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminAuthClient } from "@/lib/admin-auth-client";

export function AdminTotpSetupForm() {
  const router = useRouter();
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function enable(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await adminAuthClient.twoFactor.enable({
        password: String(formData.get("password") ?? ""),
      });
      if (result.error || result.data?.method !== "totp") {
        setError("인증 앱 설정을 시작하지 못했습니다. 비밀번호를 확인해 주세요.");
        return;
      }
      setTotpUri(result.data.totpURI);
      setBackupCodes(result.data.backupCodes ?? []);
    } catch {
      setError("인증 서비스에 연결하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function verify(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await adminAuthClient.twoFactor.verifyTotp({
        code: String(formData.get("code") ?? "").replace(/\s/g, ""),
      });
      if (result.error) {
        setError("인증 코드가 올바르지 않습니다.");
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

  if (!totpUri) {
    return (
      <form action={enable}>
        <label>
          현재 비밀번호
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? "준비 중…" : "인증 앱 설정 시작"}
        </button>
        {error ? <p role="alert">{error}</p> : null}
      </form>
    );
  }

  return (
    <>
      <p>인증 앱에 다음 설정 URI를 추가하고 6자리 코드를 입력해 주세요.</p>
      <p>
        <code>{totpUri}</code>
      </p>
      <h2>복구 코드</h2>
      <p>각 코드는 한 번만 사용할 수 있습니다. 안전한 곳에 보관하세요.</p>
      <ul>
        {backupCodes.map((code) => (
          <li key={code}>
            <code>{code}</code>
          </li>
        ))}
      </ul>
      <form action={verify}>
        <label>
          인증 코드
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            required
          />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? "확인 중…" : "인증 앱 등록 완료"}
        </button>
        {error ? <p role="alert">{error}</p> : null}
      </form>
    </>
  );
}
