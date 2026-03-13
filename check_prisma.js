const { prisma } = require('./src/lib/prisma');

async function check() {
  console.log('Database URL:', process.env.DATABASE_URL ? 'Defined' : 'UNDEFINED');
  console.log('Prisma Keys:', Object.keys(prisma).filter(k => !k.startsWith('_')));
  process.exit(0);
}

check();
