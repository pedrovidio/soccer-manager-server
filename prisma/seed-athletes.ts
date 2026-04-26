import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Porto Alegre neighborhoods with real coordinates
const neighborhoods = [
  { name: 'Moinhos de Vento',   cep: '90570-020', lat: -30.0277, lng: -51.2003 },
  { name: 'Bela Vista',         cep: '90160-180', lat: -30.0412, lng: -51.2134 },
  { name: 'Petrópolis',         cep: '90460-160', lat: -30.0350, lng: -51.1980 },
  { name: 'Menino Deus',        cep: '90130-060', lat: -30.0530, lng: -51.2180 },
  { name: 'Cidade Baixa',       cep: '90050-170', lat: -30.0450, lng: -51.2220 },
  { name: 'Bom Fim',            cep: '90035-120', lat: -30.0380, lng: -51.2150 },
  { name: 'Santana',            cep: '90040-370', lat: -30.0310, lng: -51.2100 },
  { name: 'Floresta',           cep: '90220-020', lat: -30.0260, lng: -51.2050 },
  { name: 'Navegantes',         cep: '90240-300', lat: -30.0200, lng: -51.2200 },
  { name: 'Sarandi',            cep: '91130-000', lat: -30.0050, lng: -51.1500 },
  { name: 'Rubem Berta',        cep: '91220-000', lat: -29.9980, lng: -51.1400 },
  { name: 'Passo das Pedras',   cep: '91350-000', lat: -30.0100, lng: -51.1300 },
  { name: 'Ipanema',            cep: '91760-000', lat: -30.1200, lng: -51.2400 },
  { name: 'Cavalhada',          cep: '91740-000', lat: -30.1100, lng: -51.2300 },
  { name: 'Tristeza',           cep: '91920-000', lat: -30.1050, lng: -51.2500 },
  { name: 'Vila Nova',          cep: '91710-000', lat: -30.0900, lng: -51.2100 },
  { name: 'Cristal',            cep: '91910-000', lat: -30.0800, lng: -51.2350 },
  { name: 'Jardim Botânico',    cep: '90690-000', lat: -30.0600, lng: -51.1800 },
  { name: 'Chácara das Pedras', cep: '91330-000', lat: -30.0480, lng: -51.1700 },
  { name: 'Três Figueiras',     cep: '91330-000', lat: -30.0420, lng: -51.1650 },
];

const streets = [
  'Rua Padre Chagas', 'Av. Independência', 'Rua Lima e Silva', 'Av. Osvaldo Aranha',
  'Rua Garibaldi', 'Av. Getúlio Vargas', 'Rua Ramiro Barcelos', 'Av. Ipiranga',
  'Rua João Alfredo', 'Av. Bento Gonçalves', 'Rua Fernandes Vieira', 'Av. Protásio Alves',
  'Rua Coronel Genuíno', 'Av. Carlos Gomes', 'Rua Sarmento Leite', 'Av. Nilo Peçanha',
  'Rua Andrade Neves', 'Av. Cristóvão Colombo', 'Rua Duque de Caxias', 'Av. Farrapos',
];

const firstNames = [
  'Gabriel', 'Lucas', 'Matheus', 'Pedro', 'Rafael', 'Felipe', 'Bruno', 'Diego',
  'Thiago', 'Rodrigo', 'Eduardo', 'Gustavo', 'Henrique', 'Leonardo', 'Marcelo',
  'André', 'Carlos', 'Daniel', 'Fernando', 'João', 'Leandro', 'Marcos', 'Paulo',
  'Ricardo', 'Sérgio', 'Vinicius', 'Wagner', 'Alex', 'Caio', 'Davi',
  'Ana', 'Beatriz', 'Camila', 'Daniela', 'Fernanda', 'Gabriela', 'Helena',
  'Isabela', 'Juliana', 'Karen', 'Larissa', 'Mariana', 'Natalia', 'Patricia',
];

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
  'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
  'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques',
  'Machado', 'Mendes', 'Freitas',
];

const positions = ['goalkeeper', 'defender', 'midfielder', 'forward'];
const levels: ('PROFESSIONAL' | 'AMATEUR' | 'CASUAL')[] = ['PROFESSIONAL', 'AMATEUR', 'CASUAL'];
const genders: ('M' | 'F')[] = ['M', 'F'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function jitter(coord: number, delta = 0.015): number {
  return parseFloat((coord + (Math.random() - 0.5) * delta * 2).toFixed(6));
}

// Generate unique CPFs (sequential base to avoid collisions)
function generateCpf(index: number): string {
  const base = String(index + 10000000000).slice(-11);
  return base;
}

async function seed() {
  console.log('Seeding 150 athletes from Porto Alegre...');

  const athletes = Array.from({ length: 150 }, (_, i) => {
    const neighborhood = pick(neighborhoods);
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const gender = i < 120 ? 'M' : pick(genders); // mostly male
    const position = i % 10 === 0 ? 'goalkeeper' : pick(positions);
    const level = pick(levels);
    const isGoalkeeper = position === 'goalkeeper';

    return {
      id: randomUUID(),
      name: `${firstName} ${lastName}`,
      cpf: generateCpf(i),
      email: `athlete${i + 1}@soccer.com`,
      phone: `519${String(rand(10000000, 99999999))}`,
      address_cep: neighborhood.cep,
      address_street: pick(streets),
      address_number: String(rand(1, 999)),
      address_complement: null,
      address_neighborhood: neighborhood.name,
      address_city: 'Porto Alegre',
      address_state: 'RS',
      age: rand(16, 45),
      gender,
      position,
      football_level: level,
      stats_pace:      rand(40, 95),
      stats_shooting:  isGoalkeeper ? rand(20, 50) : rand(40, 95),
      stats_passing:   rand(40, 95),
      stats_dribbling: rand(40, 95),
      stats_defense:   isGoalkeeper ? rand(60, 95) : rand(30, 90),
      stats_physical:  rand(40, 95),
      latitude: jitter(neighborhood.lat),
      longitude: jitter(neighborhood.lng),
      is_goalkeeper_for_hire: isGoalkeeper && Math.random() > 0.5,
      is_injured: false,
      financial_debt: 0,
      has_completed_assessment: false,
      pix_key: null,
    };
  });

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE athletes CASCADE`);

  // Insert in batches of 50
  for (let i = 0; i < athletes.length; i += 50) {
    const batch = athletes.slice(i, i + 50);
    await prisma.$transaction(
      batch.map((a) =>
        prisma.$executeRaw`
          INSERT INTO athletes (
            id, name, cpf, email, phone,
            address_cep, address_street, address_number, address_complement,
            address_neighborhood, address_city, address_state,
            age, gender, position, football_level,
            stats_pace, stats_shooting, stats_passing, stats_dribbling, stats_defense, stats_physical,
            latitude, longitude,
            is_goalkeeper_for_hire, is_injured, financial_debt, has_completed_assessment, pix_key
          ) VALUES (
            ${a.id}, ${a.name}, ${a.cpf}, ${a.email}, ${a.phone},
            ${a.address_cep}, ${a.address_street}, ${a.address_number}, ${a.address_complement},
            ${a.address_neighborhood}, ${a.address_city}, ${a.address_state},
            ${a.age}, ${a.gender}, ${a.position}, ${a.football_level}::"FootballLevel",
            ${a.stats_pace}, ${a.stats_shooting}, ${a.stats_passing}, ${a.stats_dribbling}, ${a.stats_defense}, ${a.stats_physical},
            ${a.latitude}, ${a.longitude},
            ${a.is_goalkeeper_for_hire}, ${a.is_injured}, ${a.financial_debt}, ${a.has_completed_assessment}, ${a.pix_key}
          )
        `
      )
    );
    console.log(`  Inserted batch ${Math.floor(i / 50) + 1}/3`);
  }

  console.log('Done! 150 athletes seeded.');
  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
