import { PrismaClient } from '@prisma/client';
import { Match } from '../../../../core/domain/entities/Match.js';
import { IMatchRepository } from '../../../../core/domain/repositories/IMatchRepository.js';
import { PrismaMatchMapper } from '../mappers/PrismaMatchMapper.js';

export class PrismaMatchRepository implements IMatchRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Match | null> {
    const match = await this.prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return null;
    }

    return PrismaMatchMapper.toDomain(match);
  }

  async listByGroup(groupId: string): Promise<Match[]> {
    const matches = await this.prisma.match.findMany({
      where: { groupId },
    });

    return matches.map(PrismaMatchMapper.toDomain);
  }

  async save(match: Match): Promise<void> {
    const data = PrismaMatchMapper.toPersistence(match);

    await this.prisma.match.upsert({
      where: { id: match.id },
      update: data,
      create: data,
    });
  }

  async findAvailableForRecruitment(filters: {
    latitude: number;
    longitude: number;
    radius: number;
  }): Promise<Match[]> {
    // Basic implementation: find matches with vacancies > 0
    // TODO: Implement spatial query with PostgreSQL PostGIS for radius filtering
    const matches = await this.prisma.match.findMany({
      where: {
        vacanciesOpen: {
          gt: 0,
        },
      },
    });

    return matches.map(PrismaMatchMapper.toDomain);
  }
}