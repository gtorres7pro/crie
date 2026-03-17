const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.attendee.count();
  const some = await prisma.attendee.findMany({ take: 5 });
  console.log('Total Attendees:', count);
  console.log('Sample Attendees:', JSON.stringify(some, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
