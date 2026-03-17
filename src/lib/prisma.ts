import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL não encontrada (.env). O build continuará, mas verifique as variáveis de ambiente no deploy.");
}

let prismaClient: PrismaClient;

if (typeof window === 'undefined') {
  const pool = new Pool({ 
    connectionString: connectionString || "",
    ssl: connectionString?.includes('db.xtjpxemtsnulcrhwnmbg.supabase.co') ? { rejectUnauthorized: false } : undefined
  });
  
  const adapter = new PrismaPg(pool as any);
  prismaClient = globalForPrisma.prisma ?? new PrismaClient({ adapter: adapter as any });
} else {
  prismaClient = globalForPrisma.prisma ?? new PrismaClient();
}

export const prisma = prismaClient;
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
