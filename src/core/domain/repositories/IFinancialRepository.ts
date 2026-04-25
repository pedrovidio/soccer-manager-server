import { FinancialTransaction } from '../entities/FinancialTransaction.js';

export interface IFinancialRepository {
  save(transaction: FinancialTransaction): Promise<void>;
  findByAthleteId(athleteId: string): Promise<FinancialTransaction[]>;
}