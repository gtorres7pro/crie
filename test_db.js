const { PrismaClient } = require('@prisma/client');

async function test(url) {
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });
  
  try {
    const users = await prisma.user.count();
    console.log("Success with:", url.substring(0, 40) + "...");
  } catch (e) {
    console.log("Error with:", url.substring(0, 40) + "...");
    console.log(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await test("postgresql://postgres.xtjpxemtsnulcrhwnmbg:CrieApp2026@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require");
  await test("postgresql://postgres:CrieApp2026@db.xtjpxemtsnulcrhwnmbg.supabase.co:5432/postgres");
}

main();
