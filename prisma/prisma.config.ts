import path from "node:path";
import type { PrismaConfig } from "prisma";

// Prisma 7 configuration — needed for prisma db push / prisma migrate
// The actual DB connection at runtime is handled via adapters in src/lib/db.ts

export default config({
  earlyAccess: true,
  schema: path.join(__dirname, "schema.prisma"),

  migrate: {
    async development() {
      const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/notifire";
      return { url };
    },
  },
});
