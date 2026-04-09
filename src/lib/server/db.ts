import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require("@libsql/client");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaLibSQL } = require("@prisma/adapter-libsql");
      const libsql = createClient({ url: tursoUrl, authToken: tursoToken });
      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({ adapter });
    } catch (e) {
      console.error("Turso adapter error, falling back:", e);
    }
  }
  return new PrismaClient();
}

// Lazy singleton — only creates client on first access
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return Reflect.get(globalForPrisma.prisma, prop);
  },
});
