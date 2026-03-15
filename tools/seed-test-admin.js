const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  await prisma.user.upsert({
    where: { email: "testadmin@criebraga.pt" },
    update: {
      password: hashedPassword,
      role: "MASTER_ADMIN",
      name: "Test Admin"
    },
    create: {
      email: "testadmin@criebraga.pt",
      name: "Test Admin",
      password: hashedPassword,
      role: "MASTER_ADMIN",
    }
  });

  console.log("Test admin created/updated: testadmin@criebraga.pt / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
