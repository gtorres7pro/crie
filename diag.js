const { prisma } = require('./src/lib/prisma');

async function check() {
  try {
    const attendeesCount = await prisma.attendee.count();
    console.log('Total Attendees:', attendeesCount);
    
    const eventsCount = await prisma.event.count();
    console.log('Total Events:', eventsCount);
    
    const cities = await prisma.city.findMany();
    console.log('Cities found:', cities.length);
    cities.forEach(c => console.log(` - ${c.name} (${c.id})`));
    
    const user = await prisma.user.findFirst({
      where: { email: 'gtorreshbl@gmail.com' },
      include: { cities: true }
    });
    
    if (user) {
      console.log('User Role:', user.role);
      console.log('User Cities:', user.cities.map(c => `${c.name} (${c.id})`));
    } else {
      console.log('User gtorreshbl@gmail.com not found!');
    }
  } catch (e) {
    console.error('Check failed:', e);
  } finally {
    process.exit(0);
  }
}

check();
