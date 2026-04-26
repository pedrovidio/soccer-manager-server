import { PrismaClient } from '@prisma/client';
import { MatchInvite } from '../../../../core/domain/entities/MatchInvite.js';
import { IMatchInviteRepository } from '../../../../core/domain/repositories/IMatchInviteRepository.js';
import { PrismaMatchInviteMapper } from '../mappers/PrismaMatchInviteMapper.js';

export class PrismaMatchInviteRepository implements IMatchInviteRepository {
  constructor(private prisma: PrismaClient) {}

  async save(invite: MatchInvite): Promise<void> {
    const data = PrismaMatchInviteMapper.toPrisma(invite);
    await this.prisma.matchInvite.upsert({
      where: { id: invite.id },
      update: data,
      create: data,
    });
  }

  async findById(id: string): Promise<MatchInvite | null> {
    const raw = await this.prisma.matchInvite.findUnique({ where: { id } });
    return raw ? PrismaMatchInviteMapper.toDomain(raw) : null;
  }

  async findByMatchAndAthlete(matchId: string, athleteId: string): Promise<MatchInvite | null> {
    const raw = await this.prisma.matchInvite.findUnique({
      where: { matchId_athleteId: { matchId, athleteId } },
    });
    return raw ? PrismaMatchInviteMapper.toDomain(raw) : null;
  }

  async findPendingByAthlete(athleteId: string): Promise<MatchInvite[]> {
    const results = await this.prisma.matchInvite.findMany({
      where: { athleteId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    return results.map(PrismaMatchInviteMapper.toDomain);
  }

  async findByMatch(matchId: string): Promise<MatchInvite[]> {
    const results = await this.prisma.matchInvite.findMany({ where: { matchId } });
    return results.map(PrismaMatchInviteMapper.toDomain);
  }
}
