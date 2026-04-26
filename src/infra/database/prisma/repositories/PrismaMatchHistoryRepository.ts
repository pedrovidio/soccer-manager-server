import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  IMatchScoreRepository,
  IMatchHistoryRepository,
  MatchScoreRecord,
  MatchHistoryFilters,
  MatchHistoryItem,
  PaginatedResult,
  TeamScore,
} from '../../../../core/domain/repositories/IMatchHistoryRepository.js';

export class PrismaMatchScoreRepository implements IMatchScoreRepository {
  constructor(private prisma: PrismaClient) {}

  async save(score: MatchScoreRecord): Promise<void> {
    await this.prisma.matchScore.upsert({
      where: { matchId: score.matchId },
      update: { scores: score.scores as any, registeredBy: score.registeredBy },
      create: { id: score.id, matchId: score.matchId, registeredBy: score.registeredBy, scores: score.scores as any },
    });
  }

  async findByMatch(matchId: string): Promise<MatchScoreRecord | null> {
    const raw = await this.prisma.matchScore.findUnique({ where: { matchId } });
    if (!raw) return null;
    return { id: raw.id, matchId: raw.matchId, registeredBy: raw.registeredBy, scores: raw.scores as unknown as TeamScore[], createdAt: raw.createdAt };
  }
}

export class PrismaMatchHistoryRepository implements IMatchHistoryRepository {
  constructor(private prisma: PrismaClient) {}

  private buildWhere(base: object, filters: MatchHistoryFilters): object {
    return {
      ...base,
      status: filters.status ? filters.status : { in: ['FINISHED', 'CANCELLED'] },
      ...(filters.type && { type: filters.type }),
      ...(filters.from || filters.to ? {
        date: {
          ...(filters.from && { gte: filters.from }),
          ...(filters.to   && { lte: filters.to }),
        },
      } : {}),
    };
  }

  private async toHistoryItems(matches: any[]): Promise<MatchHistoryItem[]> {
    const matchIds = matches.map((m) => m.id);
    const scores = await this.prisma.matchScore.findMany({ where: { matchId: { in: matchIds } } });
    const scoreMap = new Map(scores.map((s) => [s.matchId, s.scores as unknown as TeamScore[]]));

    return matches.map((m) => ({
      id: m.id,
      groupId: m.groupId,
      type: m.type,
      date: m.date,
      location: m.location,
      status: m.status,
      confirmedIds: m.confirmedIds,
      scores: scoreMap.get(m.id) ?? null,
    }));
  }

  async listByGroup(groupId: string, filters: MatchHistoryFilters): Promise<PaginatedResult<MatchHistoryItem>> {
    const where = this.buildWhere({ groupId }, filters);
    const [total, matches] = await Promise.all([
      this.prisma.match.count({ where }),
      this.prisma.match.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ]);

    return {
      data: await this.toHistoryItems(matches),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  }

  async listByAthlete(athleteId: string, filters: MatchHistoryFilters): Promise<PaginatedResult<MatchHistoryItem>> {
    const where = this.buildWhere({ confirmedIds: { has: athleteId } }, filters);
    const [total, matches] = await Promise.all([
      this.prisma.match.count({ where }),
      this.prisma.match.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ]);

    return {
      data: await this.toHistoryItems(matches),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  }
}
