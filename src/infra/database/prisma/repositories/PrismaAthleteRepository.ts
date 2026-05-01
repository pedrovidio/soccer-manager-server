import { Prisma } from '@prisma/client';
import { Athlete } from '../../../../core/domain/entities/Athlete.js';
import { IAthleteRepository, FindNearbyFilters, AthleteSearchFilters } from '../../../../core/domain/repositories/IAthleteRepository.js';
import { PrismaAthleteMapper } from '../mappers/PrismaAthleteMapper.js';
import { prisma } from '../client.js';

export class PrismaAthleteRepository implements IAthleteRepository {
  async findById(id: string): Promise<Athlete | null> {
    const raw = await prisma.athlete.findUnique({ where: { id } });
    return raw ? PrismaAthleteMapper.toDomain(raw as any) : null;
  }

  async findByCpf(cpf: string): Promise<Athlete | null> {
    const raw = await prisma.athlete.findUnique({ where: { cpf } });
    return raw ? PrismaAthleteMapper.toDomain(raw as any) : null;
  }

  async findByEmail(email: string): Promise<Athlete | null> {
    const raw = await prisma.athlete.findUnique({ where: { email } });
    return raw ? PrismaAthleteMapper.toDomain(raw as any) : null;
  }

  async save(athlete: Athlete): Promise<void> {
    const data = PrismaAthleteMapper.toPersistence(athlete);
    await prisma.athlete.upsert({
      where: { id: athlete.id },
      update: data as any,
      create: data as any,
    });
  }

  async updateLocation(athleteId: string, latitude: number, longitude: number): Promise<void> {
    await prisma.athlete.update({
      where: { id: athleteId },
      data: { latitude, longitude },
    });
  }

  async updateInjuredStatus(athleteId: string, isInjured: boolean): Promise<void> {
    await prisma.athlete.update({
      where: { id: athleteId },
      data: { isInjured },
    });
  }

  async updatePhoto(athleteId: string, photoUrl: string): Promise<void> {
    await prisma.athlete.update({
      where: { id: athleteId },
      data: { photoUrl },
    });
  }

  async findNearby(filters: FindNearbyFilters): Promise<Athlete[]> {
    const whereConditions: Prisma.Sql[] = [
      Prisma.sql`financial_debt = 0`,
      Prisma.sql`is_injured = false`,
      Prisma.sql`(6371 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS((${filters.latitude} - latitude) / 2)), 2) +
        COS(RADIANS(${filters.latitude})) * COS(RADIANS(latitude)) *
        POWER(SIN(RADIANS((${filters.longitude} - longitude) / 2)), 2)
      ))) <= ${filters.radiusInKm}`,
    ];

    if (filters.minOverall !== undefined) {
      whereConditions.push(
        Prisma.sql`((stats_pace + stats_shooting + stats_passing + stats_dribbling + stats_defense + stats_physical) / 6) >= ${filters.minOverall}`
      );
    }
    if (filters.minAge !== undefined) whereConditions.push(Prisma.sql`age >= ${filters.minAge}`);
    if (filters.maxAge !== undefined) whereConditions.push(Prisma.sql`age <= ${filters.maxAge}`);
    if (filters.positions?.length) {
      whereConditions.push(Prisma.sql`position IN (${Prisma.join(filters.positions)})`);
    }

    const results = await prisma.$queryRaw<any[]>`
      SELECT
        id, name, cpf, email, phone,
        address_cep          AS "addressCep",
        address_street       AS "addressStreet",
        address_number       AS "addressNumber",
        address_complement   AS "addressComplement",
        address_neighborhood AS "addressNeighborhood",
        address_city         AS "addressCity",
        address_state        AS "addressState",
        age, gender, position,
        football_level       AS "footballLevel",
        stats_pace           AS "statsPace",
        stats_shooting       AS "statsShooting",
        stats_passing        AS "statsPassing",
        stats_dribbling      AS "statsDribbling",
        stats_defense        AS "statsDefense",
        stats_physical       AS "statsPhysical",
        latitude, longitude,
        is_goalkeeper_for_hire AS "isGoalkeeperForHire",
        is_injured             AS "isInjured",
        financial_debt         AS "financialDebt",
        pix_key                AS "pixKey"
      FROM athletes
      WHERE ${Prisma.join(whereConditions, ' AND ')}
    `;

    return results.map((raw) => PrismaAthleteMapper.toDomain(raw));
  }

  async search(filters: AthleteSearchFilters): Promise<Athlete[]> {
    const results = await prisma.athlete.findMany({
      where: {
        OR: [
          filters.name  ? { name:  { contains: filters.name,  mode: 'insensitive' } } : undefined,
          filters.cpf   ? { cpf:   { contains: filters.cpf } }                        : undefined,
          filters.email ? { email: { contains: filters.email, mode: 'insensitive' } } : undefined,
        ].filter(Boolean) as any[],
      },
      take: 20,
    });
    return results.map((raw) => PrismaAthleteMapper.toDomain(raw as any));
  }
}
