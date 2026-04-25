import { PrismaClient, Prisma } from '@prisma/client';
import { Athlete } from '../../../../core/domain/entities/Athlete.js';
import { IAthleteRepository, FindNearbyFilters } from '../../../../core/domain/repositories/IAthleteRepository.js';
import { PrismaAthleteMapper } from '../mappers/PrismaAthleteMapper.js';
import { prisma } from '../client.js';

export class PrismaAthleteRepository implements IAthleteRepository {
  async findById(id: string): Promise<Athlete | null> {
    const raw = await prisma.athlete.findUnique({
      where: { id },
    });
    return raw ? PrismaAthleteMapper.toDomain(raw) : null;
  }

  async findByCpf(cpf: string): Promise<Athlete | null> {
    const raw = await prisma.athlete.findUnique({
      where: { cpf },
    });
    return raw ? PrismaAthleteMapper.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<Athlete | null> {
    const raw = await prisma.athlete.findUnique({
      where: { email },
    });
    return raw ? PrismaAthleteMapper.toDomain(raw) : null;
  }

  async save(athlete: Athlete): Promise<void> {
    const data = PrismaAthleteMapper.toPersistence(athlete);
    await prisma.athlete.upsert({
      where: { id: athlete.id },
      update: data,
      create: data,
    });
  }

  async findNearby(filters: FindNearbyFilters): Promise<Athlete[]> {
    // Build dynamic WHERE conditions for Haversine distance calculation
    const whereConditions: Prisma.Sql[] = [];

    // Always filter by distance using Haversine formula
    // Distance = 6371 * 2 * ASIN(SQRT(SIN²((lat2-lat1)/2) + COS(lat1)*COS(lat2)*SIN²((lon2-lon1)/2)))
    whereConditions.push(
      Prisma.sql`(6371 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS((${filters.latitude} - latitude) / 2)), 2) +
        COS(RADIANS(${filters.latitude})) * COS(RADIANS(latitude)) *
        POWER(SIN(RADIANS((${filters.longitude} - longitude) / 2)), 2)
      ))) <= ${filters.radiusInKm}`
    );

    // Filter by minimum overall (calculated as average of stats)
    if (filters.minOverall !== undefined) {
      whereConditions.push(
        Prisma.sql`(
          (stats_velocidade + stats_resistencia + stats_forca + stats_passe + stats_chute + stats_defesa + stats_drible) / 7
        ) >= ${filters.minOverall}`
      );
    }

    // Filter by age range
    if (filters.minAge !== undefined) {
      whereConditions.push(Prisma.sql`idade >= ${filters.minAge}`);
    }
    if (filters.maxAge !== undefined) {
      whereConditions.push(Prisma.sql`idade <= ${filters.maxAge}`);
    }

    // Filter by positions
    if (filters.positions && filters.positions.length > 0) {
      whereConditions.push(
        Prisma.sql`posicao IN (${Prisma.join(filters.positions)})`
      );
    }

    // Combine all WHERE conditions with AND
    const whereClause = Prisma.sql`${Prisma.join(whereConditions, ' AND ')}`;

    // Execute raw SQL query with Haversine calculation
    const results = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        nome,
        cpf,
        email,
        telefone,
        endereco_cep as "enderecoCep",
        endereco_logradouro as "enderecoLogradouro",
        endereco_numero as "enderecoNumero",
        endereco_complemento as "enderecoComplemento",
        endereco_bairro as "enderecoBairro",
        endereco_cidade as "enderecoCidade",
        endereco_uf as "enderecoUf",
        idade,
        sexo,
        posicao,
        stats_velocidade as "statsVelocidade",
        stats_resistencia as "statsResistencia",
        stats_forca as "statsForca",
        stats_passe as "statsPasse",
        stats_chute as "statsChute",
        stats_defesa as "statsDefesa",
        stats_drible as "statsDrible",
        latitude,
        longitude,
        is_goalkeeper_for_hire as "isGoalkeeperForHire",
        pix_key as "pixKey"
      FROM athletes
      WHERE ${whereClause}
    `;

    return results.map((raw) => PrismaAthleteMapper.toDomain(raw));
  }
}