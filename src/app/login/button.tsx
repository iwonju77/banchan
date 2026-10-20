"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";

export function CustomerLoginButton({ signedIn }: { signedIn: boolean }) {
  const [pending, setPending] = useState(false);

  async function login() {
    setPending(true);
    await signIn("line", { redirectTo: "/" });
    setPending(false);
  }

  async function logout() {
    setPending(true);
    await signOut({ redirectTo: "/login" });
    setPending(false);
  }

  return signedIn ? (
    <button type="button" onClick={logout} disabled={pending}>
      로그아웃
    </button>
  ) : (
    <button type="button" onClick={login} disabled={pending}>
      {pending ? "이동 중…" : "LINE으로 로그인"}
    </button>
  );
}
