import { FinancialTransaction } from '../entities/FinancialTransaction.js';

export interface GroupBalanceFilters {
  from?: Date;
  to?: Date;
}

export interface IFinancialRepository {
  save(transaction: FinancialTransaction): Promise<void>;
  findByAthleteId(athleteId: string): Promise<FinancialTransaction[]>;
  findByGroupId(groupId: string, filters?: GroupBalanceFilters): Promise<FinancialTransaction[]>;
}