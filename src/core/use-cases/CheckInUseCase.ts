import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

export interface CheckInInput {
  athleteId: string;
  matchId: string;
}

export interface CheckInOutput {
  checkedInCount: number;
  totalVacancies: number;
}

export class CheckInUseCase {
  constructor(
    private matchRepository: IMatchRepository,
    private athleteRepository: IAthleteRepository,
  ) {}

  async execute(input: CheckInInput): Promise<CheckInOutput> {
    const { athleteId, matchId } = input;

    const [athlete, match] = await Promise.all([
      this.athleteRepository.findById(athleteId),
      this.matchRepository.findById(matchId),
    ]);

    if (!athlete) throw new EntityNotFoundError('Athlete', athleteId);
    if (!match)   throw new EntityNotFoundError('Match', matchId);

    if (!match.canCheckIn(new Date())) {
      throw new BusinessRuleViolationError('Check-in is only available in the 30 minutes before the match starts');
    }

    match.checkIn(athleteId);
    await this.matchRepository.save(match);

    return { checkedInCount: match.checkedInIds.length, totalVacancies: match.totalVacancies };
  }
}
