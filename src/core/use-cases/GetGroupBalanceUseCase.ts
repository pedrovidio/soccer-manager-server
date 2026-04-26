import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IFinancialRepository, GroupBalanceFilters } from '../domain/repositories/IFinancialRepository.js';
import { TransactionStatus, TransactionType } from '../domain/entities/FinancialTransaction.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

export interface GetGroupBalanceInput {
  groupId: string;
  requesterId: string;
  filters?: GroupBalanceFilters;
}

export interface BalanceBreakdownItem {
  type: TransactionType;
  paid: number;
  pending: number;
}

export interface GetGroupBalanceOutput {
  cashInHand: number;
  totalPaid: number;
  totalPending: number;
  breakdown: BalanceBreakdownItem[];
}

export class GetGroupBalanceUseCase {
  constructor(
    private groupRepository: IGroupRepository,
    private financialRepository: IFinancialRepository,
  ) {}

  async execute(input: GetGroupBalanceInput): Promise<GetGroupBalanceOutput> {
    const group = await this.groupRepository.findById(input.groupId);
    if (!group) throw new EntityNotFoundError('Group', input.groupId);

    if (!group.isAdmin(input.requesterId)) {
      throw new BusinessRuleViolationError('Only group admins can view the balance');
    }

    const transactions = await this.financialRepository.findByGroupId(input.groupId, input.filters);

    const types = Object.values(TransactionType);
    const breakdown: BalanceBreakdownItem[] = types.map((type) => {
      const ofType = transactions.filter((t) => t.type === type);
      return {
        type,
        paid:    ofType.filter((t) => t.status === TransactionStatus.PAID).reduce((s, t) => s + t.amount, 0),
        pending: ofType.filter((t) => t.status === TransactionStatus.PENDING).reduce((s, t) => s + t.amount, 0),
      };
    });

    const totalPaid    = breakdown.reduce((s, b) => s + b.paid, 0);
    const totalPending = breakdown.reduce((s, b) => s + b.pending, 0);

    return {
      cashInHand: totalPaid,
      totalPaid,
      totalPending,
      breakdown,
    };
  }
}
