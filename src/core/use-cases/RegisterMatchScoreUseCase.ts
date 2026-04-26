import { randomUUID } from 'crypto';
import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';
import { IMatchScoreRepository, TeamScore } from '../domain/repositories/IMatchHistoryRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';
import { MatchStatus } from '../domain/entities/Match.js';

interface Input {
  matchId: string;
  registeredBy: string;
  scores: TeamScore[];
}

export class RegisterMatchScoreUseCase {
  constructor(
    private matchRepository: IMatchRepository,
    private scoreRepository: IMatchScoreRepository,
  ) {}

  async execute({ matchId, registeredBy, scores }: Input): Promise<void> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) throw new EntityNotFoundError('Match', matchId);

    if (match.status !== MatchStatus.FINISHED) {
      throw new BusinessRuleViolationError('Score can only be registered for finished matches');
    }
    if (!match.confirmedIds.includes(registeredBy)) {
      throw new BusinessRuleViolationError('Only confirmed participants can register the score');
    }
    if (scores.length < 2) {
      throw new BusinessRuleViolationError('At least 2 teams are required');
    }
    if (scores.some((s) => s.goals < 0)) {
      throw new BusinessRuleViolationError('Goals cannot be negative');
    }

    const existing = await this.scoreRepository.findByMatch(matchId);
    if (existing) throw new BusinessRuleViolationError('Score has already been registered for this match');

    await this.scoreRepository.save({
      id: randomUUID(),
      matchId,
      registeredBy,
      scores,
      createdAt: new Date(),
    });
  }
}
