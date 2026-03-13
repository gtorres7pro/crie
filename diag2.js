const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'gtorreshbl@gmail.com' },
      include: { cities: true }
    });
    console.log('User Role:', user?.role);
    console.log('Cities associated:', user?.cities?.length);
    
    const allCities = await prisma.city.findMany();
    console.log('Total Cities in DB:', allCities.length);
    allCities.forEach(c => console.log(` - ${c.name} (${c.id})`));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
