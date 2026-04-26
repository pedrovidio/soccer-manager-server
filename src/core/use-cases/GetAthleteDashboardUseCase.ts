import { IMatchHistoryRepository, MatchHistoryFilters, PaginatedResult, MatchHistoryItem } from '../domain/repositories/IMatchHistoryRepository.js';
import { IPerformanceRatingRepository } from '../domain/repositories/IPerformanceRatingRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';

// ── Athlete match history ──
export class GetAthleteMatchHistoryUseCase {
  constructor(private historyRepository: IMatchHistoryRepository) {}

  async execute(athleteId: string, filters: MatchHistoryFilters): Promise<PaginatedResult<MatchHistoryItem>> {
    return this.historyRepository.listByAthlete(athleteId, filters);
  }
}

// ── Athlete dashboard ──
interface OverallSnapshot {
  matchId: string;
  date: Date;
  overall: number;
}

interface AverageStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  overall: number;
}

interface AthleteDashboard {
  totalMatches: number;
  averageStats: AverageStats;
  overallEvolution: OverallSnapshot[];
  recentMatches: MatchHistoryItem[];
}

export class GetAthleteDashboardUseCase {
  constructor(
    private athleteRepository: IAthleteRepository,
    private ratingRepository: IPerformanceRatingRepository,
    private historyRepository: IMatchHistoryRepository,
  ) {}

  async execute(athleteId: string): Promise<AthleteDashboard> {
    const athlete = await this.athleteRepository.findById(athleteId);
    if (!athlete) throw new EntityNotFoundError('Athlete', athleteId);

    // Last 10 matches for recent list
    const recentResult = await this.historyRepository.listByAthlete(athleteId, {
      page: 1, pageSize: 10,
    });

    // All finished matches to compute overall evolution
    const allFinished = await this.historyRepository.listByAthlete(athleteId, {
      status: 'FINISHED', page: 1, pageSize: 1000,
    });

    // Aggregate all ratings received across all matches
    const allRatings = await Promise.all(
      allFinished.data.map((m) => this.ratingRepository.findByMatchAndAthlete(m.id, athleteId)),
    );
    const flatRatings = allRatings.flat();

    const averageStats: AverageStats = flatRatings.length === 0
      ? { pace: 0, shooting: 0, passing: 0, dribbling: 0, defense: 0, physical: 0, overall: 0 }
      : (() => {
          const sum = flatRatings.reduce(
            (acc, r) => ({
              pace:      acc.pace      + r.stats.pace,
              shooting:  acc.shooting  + r.stats.shooting,
              passing:   acc.passing   + r.stats.passing,
              dribbling: acc.dribbling + r.stats.dribbling,
              defense:   acc.defense   + r.stats.defense,
              physical:  acc.physical  + r.stats.physical,
            }),
            { pace: 0, shooting: 0, passing: 0, dribbling: 0, defense: 0, physical: 0 },
          );
          const n = flatRatings.length;
          const avg = {
            pace:      Math.round(sum.pace      / n),
            shooting:  Math.round(sum.shooting  / n),
            passing:   Math.round(sum.passing   / n),
            dribbling: Math.round(sum.dribbling / n),
            defense:   Math.round(sum.defense   / n),
            physical:  Math.round(sum.physical  / n),
          };
          return { ...avg, overall: Math.round(Object.values(avg).reduce((a, b) => a + b, 0) / 6) };
        })();

    // Overall evolution: average of ratings received per match, ordered by date
    const overallEvolution: OverallSnapshot[] = allFinished.data
      .map((m, i) => {
        const matchRatings = allRatings[i] ?? [];
        if (matchRatings.length === 0) return null;
        const avg = matchRatings.reduce((acc, r) => acc + (r.stats.pace + r.stats.shooting + r.stats.passing + r.stats.dribbling + r.stats.defense + r.stats.physical) / 6, 0) / matchRatings.length;
        return { matchId: m.id, date: m.date, overall: Math.round(avg) };
      })
      .filter((s): s is OverallSnapshot => s !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      totalMatches: allFinished.total,
      averageStats,
      overallEvolution,
      recentMatches: recentResult.data,
    };
  }
}
