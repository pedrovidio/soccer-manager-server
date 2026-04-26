import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { IPerformanceRatingRepository, PerformanceRating } from '../../../../core/domain/repositories/IPerformanceRatingRepository.js';

export class PrismaPerformanceRatingRepository implements IPerformanceRatingRepository {
  constructor(private prisma: PrismaClient) {}

  async save(rating: PerformanceRating): Promise<void> {
    await this.prisma.performanceRating.upsert({
      where: { matchId_ratedBy_ratedAthlete: { matchId: rating.matchId, ratedBy: rating.ratedBy, ratedAthlete: rating.ratedAthlete } },
      update: { pace: rating.stats.pace, shooting: rating.stats.shooting, passing: rating.stats.passing, dribbling: rating.stats.dribbling, defense: rating.stats.defense, physical: rating.stats.physical },
      create: { id: rating.id ?? randomUUID(), matchId: rating.matchId, ratedBy: rating.ratedBy, ratedAthlete: rating.ratedAthlete, pace: rating.stats.pace, shooting: rating.stats.shooting, passing: rating.stats.passing, dribbling: rating.stats.dribbling, defense: rating.stats.defense, physical: rating.stats.physical },
    });
  }

  async findByMatchAndRater(matchId: string, ratedBy: string): Promise<PerformanceRating[]> {
    const results = await this.prisma.performanceRating.findMany({ where: { matchId, ratedBy } });
    return results.map(this.toDomain);
  }

  async findByMatchAndAthlete(matchId: string, ratedAthlete: string): Promise<PerformanceRating[]> {
    const results = await this.prisma.performanceRating.findMany({ where: { matchId, ratedAthlete } });
    return results.map(this.toDomain);
  }

  async hasRated(matchId: string, ratedBy: string, ratedAthlete: string): Promise<boolean> {
    const count = await this.prisma.performanceRating.count({ where: { matchId, ratedBy, ratedAthlete } });
    return count > 0;
  }

  private toDomain(raw: any): PerformanceRating {
    return {
      id: raw.id,
      matchId: raw.matchId,
      ratedBy: raw.ratedBy,
      ratedAthlete: raw.ratedAthlete,
      stats: { pace: raw.pace, shooting: raw.shooting, passing: raw.passing, dribbling: raw.dribbling, defense: raw.defense, physical: raw.physical },
      createdAt: raw.createdAt,
    };
  }
}
