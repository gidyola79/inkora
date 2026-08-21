import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env (local) or your host's environment settings."
    );
  }
  // node-postgres does not enable SSL by default and ignores sslmode params,
  // while managed hosts (Render, Neon, Supabase) require SSL connections.
  // Enable it for every remote host; skip only for local databases.
  let isLocal = false;
  try {
    isLocal = ["localhost", "127.0.0.1", "::1"].includes(
      new URL(connectionString).hostname
    );
  } catch {
    // Unparseable URLs are almost certainly remote connection strings.
  }
  const adapter = new PrismaPg({
    connectionString,
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}