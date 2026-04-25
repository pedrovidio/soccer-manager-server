import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';
import { IFinancialRepository } from '../domain/repositories/IFinancialRepository.js';
import { FinancialTransaction, TransactionType } from '../domain/entities/FinancialTransaction.js';
import { MatchStatus } from '../domain/entities/Match.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

export interface HireGoalkeeperInput {
  matchId: string;
  goalkeeperId: string;
  agreedValue: number;
}

export interface HireGoalkeeperOutput {
  contractDetails: string;
  netValue: number;
}

export class HireGoalkeeperUseCase {
  constructor(
    private athleteRepository: IAthleteRepository,
    private matchRepository: IMatchRepository,
    private financialRepository: IFinancialRepository,
  ) {}

  async execute(input: HireGoalkeeperInput): Promise<HireGoalkeeperOutput> {
    const { matchId, goalkeeperId, agreedValue } = input;

    const match = await this.matchRepository.findById(matchId);
    if (!match) throw new EntityNotFoundError('Match', matchId);

    const goalkeeper = await this.athleteRepository.findById(goalkeeperId);
    if (!goalkeeper) throw new EntityNotFoundError('Athlete', goalkeeperId);

    if (!goalkeeper.isGoalkeeperForHire) throw new BusinessRuleViolationError('Athlete is not available for hire as goalkeeper');

    if (match.status !== MatchStatus.SCHEDULED) throw new BusinessRuleViolationError('Match must be scheduled to hire goalkeeper');

    const platformFee = agreedValue * 0.1;
    const netValue = agreedValue - platformFee;

    const transaction = new FinancialTransaction(
      TransactionType.GOALKEEPER_SERVICE,
      agreedValue,
      platformFee,
      goalkeeperId,
      matchId,
    );

    await this.financialRepository.save(transaction);

    return {
      contractDetails: `Goalkeeper hired for match with agreed value ${agreedValue}`,
      netValue,
    };
  }
}