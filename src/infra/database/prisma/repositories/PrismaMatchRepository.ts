import { PrismaClient } from '@prisma/client';
import { Match } from '../../../../core/domain/entities/Match.js';
import { IMatchRepository } from '../../../../core/domain/repositories/IMatchRepository.js';
import { PrismaMatchMapper } from '../mappers/PrismaMatchMapper.js';

export class PrismaMatchRepository implements IMatchRepository {
  constructor(private prisma: PrismaClient) {}

  async save(match: Match): Promise<void> {
    const data = PrismaMatchMapper.toPrisma(match);
    await this.prisma.match.upsert({
      where: { id: match.id },
      update: data,
      create: data,
    });
  }

  async findById(id: string): Promise<Match | null> {
    const raw = await this.prisma.match.findUnique({ where: { id } });
    return raw ? PrismaMatchMapper.toDomain(raw) : null;
  }

  async listByGroup(groupId: string): Promise<Match[]> {
    const results = await this.prisma.match.findMany({ where: { groupId }, orderBy: { date: 'asc' } });
    return results.map(PrismaMatchMapper.toDomain);
  }

  async findScheduledBefore(date: Date): Promise<Match[]> {
    const results = await this.prisma.match.findMany({
      where: { status: 'SCHEDULED', date: { lte: date } },
    });
    return results.map(PrismaMatchMapper.toDomain);
  }
}
