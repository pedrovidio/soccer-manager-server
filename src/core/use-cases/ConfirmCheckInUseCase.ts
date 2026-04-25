import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

export interface ConfirmCheckInInput {
  athleteId: string;
  matchId: string;
}

export class ConfirmCheckInUseCase {
  constructor(
    private matchRepository: IMatchRepository,
    private athleteRepository: IAthleteRepository,
  ) {}

  async execute(input: ConfirmCheckInInput): Promise<void> {
    const { athleteId, matchId } = input;

    const athlete = await this.athleteRepository.findById(athleteId);
    if (!athlete) throw new EntityNotFoundError('Athlete', athleteId);

    const match = await this.matchRepository.findById(matchId);
    if (!match) throw new EntityNotFoundError('Match', matchId);

    if (!match.canCheckIn(new Date())) {
      throw new BusinessRuleViolationError('Check-in is only available 30 minutes before the match starts');
    }

    if (!match.confirmedPresence.includes(athleteId)) {
      throw new BusinessRuleViolationError('Athlete is not confirmed for this match');
    }

    match.checkIn(athleteId);

    await this.matchRepository.save(match);
  }
}