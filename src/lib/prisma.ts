import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  onulbanchanPrisma?: PrismaClient;
};

export function getPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for database access");
  }

  if (!globalForPrisma.onulbanchanPrisma) {
    globalForPrisma.onulbanchanPrisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString }),
    });
  }

  return globalForPrisma.onulbanchanPrisma;
}

export function getPrismaClientIfConfigured(): PrismaClient | null {
  return process.env.DATABASE_URL ? getPrismaClient() : null;
}
