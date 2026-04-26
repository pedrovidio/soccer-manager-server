import { Stats } from '../entities/Athlete.js';

export interface PerformanceRating {
  id: string;
  matchId: string;
  ratedBy: string;
  ratedAthlete: string;
  stats: Stats;
  createdAt: Date;
}

export interface IPerformanceRatingRepository {
  save(rating: PerformanceRating): Promise<void>;
  findByMatchAndRater(matchId: string, ratedBy: string): Promise<PerformanceRating[]>;
  findByMatchAndAthlete(matchId: string, ratedAthlete: string): Promise<PerformanceRating[]>;
  hasRated(matchId: string, ratedBy: string, ratedAthlete: string): Promise<boolean>;
}
