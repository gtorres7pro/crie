import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = "postgresql://postgres.xtjpxemtsnulcrhwnmbg:CrieApp2026@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require";

const pool = new Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});
const adapter = new PrismaPg(pool as any);

export const prisma = new PrismaClient({
    adapter,
  });
// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
