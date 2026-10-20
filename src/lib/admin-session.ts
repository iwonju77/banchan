import "server-only";

import { headers } from "next/headers";
import { createAdminAuth } from "@/lib/admin-auth";

export async function getAdminSession() {
  const requestHeaders = await headers();
  if (
    !process.env.ADMIN_AUTH_SECRET ||
    !process.env.AUTH_URL ||
    !process.env.DATABASE_URL
  ) {
    return null;
  }
  return createAdminAuth().api.getSession({ headers: requestHeaders });
}
