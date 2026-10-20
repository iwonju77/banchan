import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import { hashPassword } from "better-auth/crypto";
import { getPrismaClient } from "../src/lib/prisma";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Administrator";

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("Set a valid ADMIN_BOOTSTRAP_EMAIL in the environment.");
  }
  if (!password || password.length < 6) {
    throw new Error("ADMIN_BOOTSTRAP_PASSWORD must contain at least 6 characters.");
  }

  const prisma = getPrismaClient();
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An administrator with that email already exists.");
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction(async (transaction) => {
    const user = await transaction.adminUser.create({
      data: { name, email, emailVerified: true },
    });
    await transaction.adminAccount.create({
      data: {
        id: randomUUID(),
        accountId: email,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    });
    await transaction.auditLog.create({
      data: {
        actorType: "system",
        action: "admin.bootstrap",
        targetType: "admin",
        targetId: user.id,
      },
    });
  });

  console.info(`Bootstrapped administrator ${email}. Remove bootstrap secrets from the environment.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Administrator bootstrap failed.");
  process.exitCode = 1;
});
