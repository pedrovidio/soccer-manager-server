import { randomUUID } from 'crypto';
import { Stats } from '../domain/entities/Athlete.js';
import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { IPerformanceRatingRepository } from '../domain/repositories/IPerformanceRatingRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';
import { MatchStatus } from '../domain/entities/Match.js';

export interface RegisterRatingInput {
  matchId: string;
  ratedBy: string;
  ratedAthlete: string;
  stats: Stats;
}

export interface RegisterRatingOutput {
  ratingId: string;
  newOverall: number;
}

export class RegisterRatingUseCase {
  constructor(
    private matchRepository: IMatchRepository,
    private athleteRepository: IAthleteRepository,
    private ratingRepository: IPerformanceRatingRepository,
  ) {}

  async execute(input: RegisterRatingInput): Promise<RegisterRatingOutput> {
    const { matchId, ratedBy, ratedAthlete, stats } = input;

    if (ratedBy === ratedAthlete) {
      throw new BusinessRuleViolationError('Athletes cannot rate themselves');
    }

    const [match, rater, athlete] = await Promise.all([
      this.matchRepository.findById(matchId),
      this.athleteRepository.findById(ratedBy),
      this.athleteRepository.findById(ratedAthlete),
    ]);

    if (!match)   throw new EntityNotFoundError('Match', matchId);
    if (!rater)   throw new EntityNotFoundError('Athlete', ratedBy);
    if (!athlete) throw new EntityNotFoundError('Athlete', ratedAthlete);

    if (match.status !== MatchStatus.FINISHED) {
      throw new BusinessRuleViolationError('Ratings can only be submitted for finished matches');
    }

    if (!match.confirmedIds.includes(ratedBy)) {
      throw new BusinessRuleViolationError('Only athletes who participated in the match can submit ratings');
    }

    if (!match.confirmedIds.includes(ratedAthlete)) {
      throw new BusinessRuleViolationError('Rated athlete did not participate in this match');
    }

    const alreadyRated = await this.ratingRepository.hasRated(matchId, ratedBy, ratedAthlete);
    if (alreadyRated) {
      throw new BusinessRuleViolationError('You have already rated this athlete for this match');
    }

    const ratingId = randomUUID();
    await this.ratingRepository.save({ id: ratingId, matchId, ratedBy, ratedAthlete, stats, createdAt: new Date() });

    // Recalculate overall from all ratings for this athlete in this match
    const allRatings = await this.ratingRepository.findByMatchAndAthlete(matchId, ratedAthlete);

    const avgStats: Stats = {
      pace:      Math.round(allRatings.reduce((s, r) => s + r.stats.pace, 0)      / allRatings.length),
      shooting:  Math.round(allRatings.reduce((s, r) => s + r.stats.shooting, 0)  / allRatings.length),
      passing:   Math.round(allRatings.reduce((s, r) => s + r.stats.passing, 0)   / allRatings.length),
      dribbling: Math.round(allRatings.reduce((s, r) => s + r.stats.dribbling, 0) / allRatings.length),
      defense:   Math.round(allRatings.reduce((s, r) => s + r.stats.defense, 0)   / allRatings.length),
      physical:  Math.round(allRatings.reduce((s, r) => s + r.stats.physical, 0)  / allRatings.length),
    };

    athlete.updatePerformance(avgStats);
    await this.athleteRepository.save(athlete);

    return { ratingId, newOverall: athlete.calculateOverall() };
  }
}
