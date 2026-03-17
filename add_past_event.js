const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const braga = await prisma.city.findFirst({
    where: { name: { contains: 'Braga', mode: 'insensitive' } }
  });

  if (!braga) {
    console.log('Cidade Braga não encontrada.');
    return;
  }

  const event = await prisma.event.create({
    data: {
      title: 'CRIE Lagoinha Braga - Manoel Alvino',
      description: 'Uma noite de inspiração, estratégia e direção para quem quer fazer a diferença onde Deus o colocou. Convidado especial: Manoel Alvino.',
      date: new Date('2026-02-10T19:30:00Z'),
      location: 'Holiday Inn - Braga',
      price: 7,
      capacity: 100,
      status: 'CONCLUIDO',
      cityId: braga.id
    }
  });

  console.log('Evento criado com sucesso:', event);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
