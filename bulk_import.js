
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = "postgresql://postgres:CrieApp2026@db.xtjpxemtsnulcrhwnmbg.supabase.co:5432/postgres";
const pool = new Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const attendees = [
  { email: 'alineaugusto391@gmail.com', name: 'Aline Augusto França', phone: '913863408', company: 'Projeto WA', industry: 'Construção Civil' },
  { email: 'wellingtonbarbozafranca@gmail.com', name: 'Wellington Baboza França', phone: '934716414', company: 'Projeto WA', industry: 'Construção Civil' },
  { email: 'michellecoelhopo@gmail.com', name: 'Michelle Castro Coelho', phone: '935457022', company: 'Casal Parrilha e Tasca do Coelho', industry: 'Restauração' },
  { email: 'jpo1coelho@gmail.com', name: 'Paulo Otávio', phone: '935458166', company: 'Casal parrilha/ tasca do coelho', industry: 'Restauração' },
  { email: 'juniorcoelhopt@outlook.com', name: 'Paulo José Coelho Júnior', phone: '937315230', company: 'Churrascaria casal parrilha', industry: 'Restauração' },
  { email: 'bernard.w.alve@gmail.com', name: 'Bernard William Vieira Alves', phone: '967715318', company: 'BWbarbearia', industry: 'Barbeiro' },
  { email: 'anapauladelimaribeiro@gmail.com', name: 'Ana Paula de Lima Ribeiro', phone: '969128125', company: 'BWbarbearia', industry: 'Receção' },
  { email: 'robertalucasgiovani@gmail.com', name: 'Roberta sousa', phone: '915879312', company: 'Ednelson & Roberta Sousa Ida', industry: 'Transportes' },
  { email: 'smunizb1975@gmail.com', name: 'Sérgio Muniz Bezerra', phone: '932356292', company: 'Sérgio Bezerra', industry: 'Automotivo / serviços' },
  { email: 'wfcorrea@gmail.com', name: 'Willyam Farias Corrêa', phone: '929048073', company: 'Check Up Total', industry: 'Reparação Automotiva' },
  { email: 'lucasgiovanisousa@gmail.com', name: 'Lucas Giovani Sousa', phone: '915879311', company: 'Lucas Giovani', industry: 'Criação estratégias de website' },
  { email: 'juuh.alves588@gmail.com', name: 'Julia Alves Saraiva', phone: '938777880', company: 'TJ ASSESSORIA PT', industry: 'Assessoria Imigratória' },
  { email: 'robertnovaes_kr@hotmail.com', name: 'Robert Araujo', phone: '933658607', company: 'RD decoração e festas', industry: 'Decoração des festa e eventos' },
  { email: 'danielaclcoelho@gmail.com', name: 'Daniela Coelho', phone: '935249313', company: 'RD decoração e festas', industry: 'Decoração e eventos' },
  { email: 'taina.lbernardi@gmail.com', name: 'Taina Lerina Bernardi', phone: '911995071', company: 'Eternity studio', industry: 'Marketing e fotografia e videografia' },
  { email: 'pedrodiniz189@gmail.com', name: 'Pedro Lucas Diniz', phone: '918256877', company: 'BE barbearia', industry: 'Barbeiro' },
  { email: 'christiannysid@hotmail.com', name: 'Sidnei Araújo', phone: '910650788', company: 'SAF Rent a Car', industry: 'Mecânica automotiva' },
];

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'LIVE' },
    orderBy: { date: 'asc' }
  });

  if (!event) {
    console.error('Nenhum evento LIVE encontrado.');
    return;
  }

  console.log(`Inserindo participantes no evento: ${event.title} (${event.id})`);

  for (const attendee of attendees) {
    try {
      const existing = await prisma.attendee.findFirst({
        where: { email: attendee.email, eventId: event.id }
      });

      if (existing) {
        console.warn(`Participante já inscrito: ${attendee.email}`);
        continue;
      }

      await prisma.attendee.create({
        data: {
          ...attendee,
          eventId: event.id,
          paymentStatus: 'Pendente',
          presenceStatus: 'Pendente',
          interests: ['Networking', 'Crescimento']
        }
      });
      console.log(`Inserido com sucesso: ${attendee.name} (${attendee.email})`);
    } catch (e) {
      console.error(`Erro ao inserir ${attendee.email}:`, e.message);
    }
  }
}

main().finally(() => {
  prisma.$disconnect();
  pool.end();
});
