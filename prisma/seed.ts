import 'dotenv/config';
import { PrismaClient, FootballLevel, MatchStatus, MatchType, TransactionStatus, TransactionType, NotificationType, InviteStatus, MatchInviteStatus, MatchInviteType } from '@prisma/client';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const jitter = (coord: number, delta = 0.02) =>
  parseFloat((coord + (Math.random() - 0.5) * delta * 2).toFixed(6));

const neighborhoods = [
  { name: 'Vila Madalena', cep: '05435000', lat: -23.5505, lng: -46.6900 },
  { name: 'Pinheiros',     cep: '05422000', lat: -23.5630, lng: -46.6820 },
  { name: 'Moema',         cep: '04077000', lat: -23.6010, lng: -46.6650 },
  { name: 'Itaim Bibi',    cep: '04538000', lat: -23.5850, lng: -46.6750 },
  { name: 'Santana',       cep: '02401000', lat: -23.5020, lng: -46.6280 },
  { name: 'Tatuapé',       cep: '03310000', lat: -23.5380, lng: -46.5750 },
  { name: 'Lapa',          cep: '05073000', lat: -23.5230, lng: -46.7050 },
  { name: 'Guarulhos',     cep: '07010000', lat: -23.4630, lng: -46.5330 },
  { name: 'Osasco',        cep: '06010000', lat: -23.5320, lng: -46.7920 },
  { name: 'Santo André',   cep: '09010000', lat: -23.6640, lng: -46.5330 },
];

const streets = [
  'Rua Harmonia', 'Av. Paulista', 'Rua Augusta', 'Av. Brigadeiro Faria Lima',
  'Rua Oscar Freire', 'Av. Rebouças', 'Rua Teodoro Sampaio', 'Av. Brasil',
  'Rua Haddock Lobo', 'Av. Consolação',
];

const firstNames = [
  'Gabriel', 'Lucas', 'Matheus', 'Rafael', 'Felipe', 'Bruno', 'Diego',
  'Thiago', 'Rodrigo', 'Eduardo', 'Gustavo', 'Henrique', 'Leonardo', 'Marcelo',
  'André', 'Carlos', 'Daniel', 'Fernando', 'João', 'Leandro', 'Marcos', 'Paulo',
  'Ricardo', 'Vinicius', 'Alex', 'Caio', 'Davi', 'Igor', 'Renato', 'Fabio',
];

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
  'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
];

const levels: FootballLevel[] = ['PROFESSIONAL', 'AMATEUR', 'CASUAL'];
const positions = ['goalkeeper', 'defender', 'midfielder', 'forward'];

function cpf(i: number) { return String(i + 10000000000).slice(-11); }

async function main() {
  console.log('🌱 Iniciando seed completo...\n');

  // ── 1. Limpar banco ──────────────────────────────────────────────────────────
  console.log('🗑  Limpando tabelas...');
  await prisma.performanceRating.deleteMany();
  await prisma.matchScore.deleteMany();
  await prisma.matchInvite.deleteMany();
  await prisma.match.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.groupInvite.deleteMany();
  await prisma.groupAdminDelegation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.athleteSocialAccount.deleteMany();
  await prisma.group.deleteMany();
  await prisma.athlete.deleteMany();

  // ── 2. Atleta principal ───────────────────────────────────────────────────────
  console.log('👤 Criando atleta principal...');
  const passwordHash = await bcrypt.hash('senha123', 10);
  const nb0 = neighborhoods[0];

  const main = await prisma.athlete.create({
    data: {
      id: randomUUID(),
      name: 'Pedro Henrique Silva',
      cpf: '12345678901',
      email: 'pedro@soccer.com',
      phone: '11999990001',
      addressCep: nb0.cep,
      addressStreet: 'Rua Harmonia',
      addressNumber: '123',
      addressComplement: 'Apto 4',
      addressNeighborhood: nb0.name,
      addressCity: 'São Paulo',
      addressState: 'SP',
      age: 28,
      gender: 'M',
      position: 'midfielder',
      footballLevel: 'AMATEUR',
      statsPace: 75,
      statsShooting: 72,
      statsPassing: 80,
      statsDribbling: 78,
      statsDefense: 68,
      statsPhysical: 74,
      latitude: nb0.lat,
      longitude: nb0.lng,
      isGoalkeeperForHire: false,
      isInjured: false,
      financialDebt: 0,
      hasCompletedAssessment: true,
      pixKey: 'pedro@pix.com',
      passwordHash,
    },
  });

  // ── 3. Assessment do atleta principal ────────────────────────────────────────
  console.log('📋 Criando assessment...');
  await prisma.assessment.create({
    data: {
      id: randomUUID(),
      athleteId: main.id,
      playedProfessionally: false,
      highestLevel: 'AMATEUR',
      yearsPlaying: 'TWO_TO_5',
      weeklyFrequency: 'ONE_TO_2',
      selfRatedPace: 75,
      selfRatedShooting: 72,
      selfRatedPassing: 80,
      selfRatedDribbling: 78,
      selfRatedDefense: 68,
      selfRatedPhysical: 74,
      preferredPosition: 'Midfielder',
    },
  });

  // ── 4. Atletas secundários (30) ───────────────────────────────────────────────
  console.log('👥 Criando 30 atletas secundários...');
  const secondaryIds: string[] = [];

  for (let i = 0; i < 30; i++) {
    const nb = pick(neighborhoods);
    const pos = i % 6 === 0 ? 'goalkeeper' : pick(positions);
    const isGk = pos === 'goalkeeper';
    const hash = await bcrypt.hash('senha123', 10);
    const id = randomUUID();
    secondaryIds.push(id);

    await prisma.athlete.create({
      data: {
        id,
        name: `${pick(firstNames)} ${pick(lastNames)}`,
        cpf: cpf(i + 1),
        email: `athlete${i + 1}@soccer.com`,
        phone: `119${rand(10000000, 99999999)}`,
        addressCep: nb.cep,
        addressStreet: pick(streets),
        addressNumber: String(rand(1, 999)),
        addressNeighborhood: nb.name,
        addressCity: 'São Paulo',
        addressState: 'SP',
        age: rand(18, 42),
        gender: 'M',
        position: pos,
        footballLevel: pick(levels),
        statsPace: rand(50, 92),
        statsShooting: isGk ? rand(20, 50) : rand(45, 92),
        statsPassing: rand(50, 92),
        statsDribbling: rand(50, 92),
        statsDefense: isGk ? rand(65, 92) : rand(40, 88),
        statsPhysical: rand(50, 92),
        latitude: jitter(nb.lat),
        longitude: jitter(nb.lng),
        isGoalkeeperForHire: isGk && Math.random() > 0.4,
        isInjured: false,
        financialDebt: i < 3 ? rand(20, 80) : 0,
        hasCompletedAssessment: Math.random() > 0.3,
        pixKey: Math.random() > 0.5 ? `athlete${i + 1}@pix.com` : null,
        passwordHash: hash,
      },
    });
  }

  const allIds = [main.id, ...secondaryIds];

  // ── 5. Grupos ─────────────────────────────────────────────────────────────────
  console.log('🏟  Criando grupos...');

  const group1Members = secondaryIds.slice(0, 10);
  const group1 = await prisma.group.create({
    data: {
      id: randomUUID(),
      name: 'Resenha FC',
      description: 'O melhor racha de Vila Madalena',
      adminIds: [main.id],
      memberIds: group1Members,
      pixKey: 'resenhafc@pix.com',
      monthlyFee: 50,
      goalkeeperPaymentMode: 'SPLIT',
      status: 'ACTIVE',
    },
  });

  const group2Admin = secondaryIds[0];
  const group2Members = [main.id, ...secondaryIds.slice(10, 19)];
  const group2 = await prisma.group.create({
    data: {
      id: randomUUID(),
      name: 'Galera do Society',
      description: 'Society toda semana em Pinheiros',
      adminIds: [group2Admin],
      memberIds: group2Members,
      pixKey: 'galeraso@pix.com',
      monthlyFee: 30,
      goalkeeperPaymentMode: 'SPLIT',
      status: 'ACTIVE',
    },
  });

  const group3Admin = secondaryIds[1];
  const group3Members = secondaryIds.slice(19, 29);
  const group3 = await prisma.group.create({
    data: {
      id: randomUUID(),
      name: 'Fut Resenha',
      description: 'Futsal toda quarta',
      adminIds: [group3Admin],
      memberIds: group3Members,
      monthlyFee: 25,
      goalkeeperPaymentMode: 'SPLIT',
      status: 'ACTIVE',
    },
  });

  // ── 6. Partidas ───────────────────────────────────────────────────────────────
  console.log('⚽ Criando partidas...');

  const now = new Date();
  const mkDate = (offsetDays: number, hour: number) => {
    const d = new Date(now.getTime() + offsetDays * 86400000);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const confirmed1 = [main.id, ...group1Members.slice(0, 9)];
  const confirmed2 = [main.id, ...group1Members.slice(0, 7)];

  const match1 = await prisma.match.create({
    data: {
      id: randomUUID(), groupId: group1.id, type: 'CAMPO',
      date: mkDate(3, 16), location: 'Campo Arena Show – Rua das Flores, 123, SP',
      latitude: -23.5505, longitude: -46.6900,
      totalVacancies: 14, reserveVacancies: 2, spotRadiusKm: 10,
      minOverall: 60, minAge: 16, maxAge: 50,
      confirmedIds: confirmed1, checkedInIds: [], status: 'SCHEDULED',
    },
  });

  const match2 = await prisma.match.create({
    data: {
      id: randomUUID(), groupId: group1.id, type: 'SOCIETY',
      date: mkDate(7, 9), location: 'Society Clube Verde – Av. Rebouças, 500, SP',
      latitude: -23.5630, longitude: -46.6820,
      totalVacancies: 10, reserveVacancies: 2, spotRadiusKm: 8,
      minOverall: 55, minAge: 16, maxAge: 45,
      confirmedIds: confirmed2, checkedInIds: [], status: 'SCHEDULED',
    },
  });

  const match3 = await prisma.match.create({
    data: {
      id: randomUUID(), groupId: group2.id, type: 'FUTSAL',
      date: mkDate(14, 20), location: 'Arena Society – Av. Paulista, 1000, SP',
      latitude: -23.5630, longitude: -46.6540,
      totalVacancies: 12, reserveVacancies: 2, spotRadiusKm: 5,
      minOverall: 50, minAge: 16, maxAge: 50,
      confirmedIds: group2Members.slice(1, 8), checkedInIds: [], status: 'SCHEDULED',
    },
  });

  const match4 = await prisma.match.create({
    data: {
      id: randomUUID(), groupId: group1.id, type: 'CAMPO',
      date: mkDate(-7, 16), location: 'Campo Arena Show – Rua das Flores, 123, SP',
      latitude: -23.5505, longitude: -46.6900,
      totalVacancies: 14, reserveVacancies: 2, spotRadiusKm: 10,
      minOverall: 60, minAge: 16, maxAge: 50,
      confirmedIds: confirmed1, checkedInIds: confirmed1, status: 'FINISHED',
    },
  });

  const match5 = await prisma.match.create({
    data: {
      id: randomUUID(), groupId: group1.id, type: 'SOCIETY',
      date: mkDate(-14, 9), location: 'Society Clube Verde – Av. Rebouças, 500, SP',
      latitude: -23.5630, longitude: -46.6820,
      totalVacancies: 10, reserveVacancies: 2, spotRadiusKm: 8,
      minOverall: 55, minAge: 16, maxAge: 45,
      confirmedIds: confirmed1, checkedInIds: confirmed1, status: 'FINISHED',
    },
  });

  const match6 = await prisma.match.create({
    data: {
      id: randomUUID(), groupId: group2.id, type: 'CAMPO',
      date: mkDate(-21, 20), location: 'Galera Arena – Rua Teodoro Sampaio, 200, SP',
      latitude: -23.5630, longitude: -46.6820,
      totalVacancies: 14, reserveVacancies: 2, spotRadiusKm: 10,
      minOverall: 55, minAge: 16, maxAge: 50,
      confirmedIds: [main.id, ...group2Members.slice(1, 5)], checkedInIds: [], status: 'CANCELLED',
    },
  });

  // ── 7. Match Invites ──────────────────────────────────────────────────────────
  console.log('📨 Criando convites de partida...');
  await prisma.matchInvite.create({
    data: {
      id: randomUUID(), matchId: match3.id, athleteId: main.id,
      inviteType: 'SPOT', status: 'PENDING',
    },
  });

  // ── 8. Match Scores ───────────────────────────────────────────────────────────
  console.log('🏆 Registrando placares...');
  await prisma.matchScore.create({
    data: {
      id: randomUUID(), matchId: match4.id, registeredBy: main.id,
      scores: [{ teamName: 'Time Azul', goals: 3 }, { teamName: 'Time Branco', goals: 2 }],
    },
  });
  await prisma.matchScore.create({
    data: {
      id: randomUUID(), matchId: match5.id, registeredBy: main.id,
      scores: [{ teamName: 'Time Azul', goals: 2 }, { teamName: 'Time Branco', goals: 2 }],
    },
  });

  // ── 9. Performance Ratings ────────────────────────────────────────────────────
  console.log('⭐ Criando avaliações de performance...');
  for (const raterId of group1Members.slice(0, 5)) {
    for (const matchId of [match4.id, match5.id]) {
      await prisma.performanceRating.create({
        data: {
          id: randomUUID(), matchId, ratedBy: raterId, ratedAthlete: main.id,
          pace: rand(65, 85), shooting: rand(60, 82), passing: rand(70, 88),
          dribbling: rand(65, 85), defense: rand(60, 80), physical: rand(65, 82),
        },
      });
    }
  }

  // ── 10. Transações Financeiras ────────────────────────────────────────────────
  console.log('💰 Criando transações financeiras...');

  await prisma.financialTransaction.createMany({
    data: [
      { id: randomUUID(), athleteId: main.id, groupId: group1.id, amount: 50, type: 'MONTHLY', status: 'PAID',    platformFee: 0, createdAt: new Date(now.getTime() - 60 * 86400000) },
      { id: randomUUID(), athleteId: main.id, groupId: group1.id, amount: 50, type: 'MONTHLY', status: 'PAID',    platformFee: 0, createdAt: new Date(now.getTime() - 30 * 86400000) },
      { id: randomUUID(), athleteId: main.id, groupId: group1.id, amount: 50, type: 'MONTHLY', status: 'PENDING', platformFee: 0, createdAt: now },
      { id: randomUUID(), athleteId: main.id, matchId: match4.id, groupId: group1.id, amount: 20, type: 'SPOT', status: 'PAID',    platformFee: 0, createdAt: match4.date },
      { id: randomUUID(), athleteId: main.id, matchId: match5.id, groupId: group1.id, amount: 20, type: 'SPOT', status: 'PAID',    platformFee: 0, createdAt: match5.date },
      { id: randomUUID(), athleteId: main.id, matchId: match1.id, groupId: group1.id, amount: 20, type: 'SPOT', status: 'PENDING', platformFee: 0, createdAt: now },
    ],
  });

  for (const memberId of group1Members.slice(0, 8)) {
    await prisma.financialTransaction.create({
      data: {
        id: randomUUID(), athleteId: memberId, groupId: group1.id,
        amount: 50, type: 'MONTHLY',
        status: Math.random() > 0.3 ? 'PAID' : 'PENDING',
        platformFee: 0,
      },
    });
  }

  // ── 11. Group Invites ─────────────────────────────────────────────────────────
  console.log('📬 Criando convites de grupo...');
  await prisma.groupInvite.create({
    data: {
      id: randomUUID(), groupId: group3.id,
      invitedBy: group3Admin, athleteId: main.id, status: 'PENDING',
    },
  });

  // ── 12. Notificações ──────────────────────────────────────────────────────────
  console.log('🔔 Criando notificações...');
  const notifs = [
    { type: 'MATCH_INVITE' as NotificationType,          title: 'Convite para partida',   body: 'Você foi convidado para a partida do Fut Resenha',              referenceId: match3.id, isRead: false, offset: -10 * 60000 },
    { type: 'GROUP_INVITE' as NotificationType,          title: 'Convite para grupo',      body: 'Fut Resenha convidou você para participar do grupo',            referenceId: group3.id, isRead: false, offset: -2 * 3600000 },
    { type: 'SYSTEM' as NotificationType,                title: 'Pagamento recebido',      body: 'Mensalidade de Abril – Resenha FC confirmada',                  referenceId: null,      isRead: true,  offset: -3 * 3600000 },
    { type: 'SYSTEM' as NotificationType,                title: 'Lembrete de check-in',    body: 'Partida em breve – faça check-in até 30 min antes',             referenceId: match1.id, isRead: true,  offset: -5 * 3600000 },
    { type: 'MATCH_INVITE_DECLINED' as NotificationType, title: 'Partida cancelada',       body: 'A partida da Galera do Society foi cancelada pelo administrador', referenceId: match6.id, isRead: true,  offset: -24 * 3600000 },
    { type: 'INVITE_ACCEPTED' as NotificationType,       title: 'Convite aceito',          body: 'Um atleta aceitou seu convite para o Resenha FC',               referenceId: group1.id, isRead: true,  offset: -48 * 3600000 },
  ];

  for (const n of notifs) {
    await prisma.notification.create({
      data: {
        id: randomUUID(), athleteId: main.id, type: n.type,
        title: n.title, body: n.body, referenceId: n.referenceId,
        isRead: n.isRead, createdAt: new Date(now.getTime() + n.offset),
      },
    });
  }

  // ── 13. Disponibilidades ──────────────────────────────────────────────────────
  console.log('📅 Criando disponibilidades...');
  await prisma.availability.createMany({
    data: [
      { id: randomUUID(), athleteId: main.id, dayOfWeek: 6, startTime: '14:00', endTime: '18:00' },
      { id: randomUUID(), athleteId: main.id, dayOfWeek: 0, startTime: '08:00', endTime: '12:00' },
    ],
  });

  // ── Resumo ────────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed concluído!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Credenciais do usuário principal:');
  console.log('   Email:  pedro@soccer.com');
  console.log('   Senha:  senha123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👥 Atletas:      31 (1 principal + 30 secundários)');
  console.log('🏟  Grupos:      3  (Resenha FC, Galera do Society, Fut Resenha)');
  console.log('⚽ Partidas:     6  (3 futuras · 2 finalizadas · 1 cancelada)');
  console.log('💰 Transações:   14 financeiras');
  console.log('🔔 Notificações: 6  (2 não lidas)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Erro no seed:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
