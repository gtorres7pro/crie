require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Gerando dados de seed...');

  // 1. Criar Usuário Admin
  const adminPassword = await bcrypt.hash('CrieAdmin2026', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@criebraga.pt' },
    update: {},
    create: {
      email: 'admin@criebraga.pt',
      name: 'Gabriel Admin',
      phone: '+351912345678',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin criado: ${admin.email}`);

  // 2. Criar Evento Inicial
  const nextEvent = await prisma.event.create({
    data: {
      title: 'CRIE Braga - Network Inaugural',
      description: 'O primeiro grande evento de networking do CRIE em Braga. Venha conectar-se com empreendedores locais.',
      date: new Date('2026-03-16T20:00:00Z'),
      location: 'Lagoinha Braga',
      capacity: 50,
      price: 0,
      status: 'active',
    },
  });
  console.log(`✅ Evento criado: ${nextEvent.title}`);

  // 3. Criar Inscritos de Teste
  await prisma.attendee.createMany({
    data: [
      {
        name: 'João Silva',
        email: 'joao@exemplo.com',
        phone: '+351911111111',
        industry: 'Tecnologia',
        interests: ['Networking', 'Parcerias'],
        eventId: nextEvent.id,
        paymentStatus: 'Gratuito',
        presenceStatus: 'Pendente',
      },
      {
        name: 'Maria Oliveira',
        email: 'maria@exemplo.com',
        phone: '+351922222222',
        industry: 'Marketing',
        interests: ['Vendas', 'Crescimento'],
        eventId: nextEvent.id,
        paymentStatus: 'Gratuito',
        presenceStatus: 'Pendente',
      },
    ],
  });
  console.log('✅ Inscritos de teste criados');

  console.log('🏁 Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
