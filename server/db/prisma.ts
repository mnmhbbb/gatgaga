import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const prismaGlobal = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL 환경 변수가 필요합니다.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export const prisma = prismaGlobal.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  prismaGlobal.prisma = prisma;
}
