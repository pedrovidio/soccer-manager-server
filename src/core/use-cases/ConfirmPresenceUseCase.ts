import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';
import { IMatchInviteRepository } from '../domain/repositories/IMatchInviteRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';
import { FinancialDebtError } from '../domain/errors/FinancialDebtError.js';

export interface ConfirmPresenceInput {
  athleteId: string;
  matchId: string;
}

export interface ConfirmPresenceOutput {
  confirmedCount: number;
  totalVacancies: number;
}

export class ConfirmPresenceUseCase {
  constructor(
    private matchRepository: IMatchRepository,
    private matchInviteRepository: IMatchInviteRepository,
    private athleteRepository: IAthleteRepository,
  ) {}

  async execute(input: ConfirmPresenceInput): Promise<ConfirmPresenceOutput> {
    const { athleteId, matchId } = input;

    const [athlete, match] = await Promise.all([
      this.athleteRepository.findById(athleteId),
      this.matchRepository.findById(matchId),
    ]);

    if (!athlete) throw new EntityNotFoundError('Athlete', athleteId);
    if (!match)   throw new EntityNotFoundError('Match', matchId);

    if (athlete.financialDebt > 0) throw new FinancialDebtError();
    if (athlete.isInjured) throw new BusinessRuleViolationError('Injured athletes cannot confirm presence');

    if (!match.canConfirmPresence(new Date())) {
      throw new BusinessRuleViolationError(
        'Presence confirmation is closed — match starts in less than 30 minutes or is not scheduled',
      );
    }

    const invite = await this.matchInviteRepository.findByMatchAndAthlete(matchId, athleteId);
    if (!invite || invite.status !== 'ACCEPTED') {
      throw new BusinessRuleViolationError('Athlete must have an accepted invite to confirm presence');
    }

    match.confirmPresence(athleteId);
    await this.matchRepository.save(match);

    return { confirmedCount: match.confirmedIds.length, totalVacancies: match.totalVacancies };
  }
}
