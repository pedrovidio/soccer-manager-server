import { IFinancialRepository } from '../domain/repositories/IFinancialRepository.js';
import { TransactionStatus, TransactionType } from '../domain/entities/FinancialTransaction.js';

export class CheckAthleteDebtStatusUseCase {
  constructor(private financialRepository: IFinancialRepository) {}

  async execute(athleteId: string): Promise<boolean> {
    const transactions = await this.financialRepository.findByAthleteId(athleteId);
    const now = new Date();
    return transactions.some(t => 
      t.status === TransactionStatus.PENDING && 
      (t.type === TransactionType.SPOT || t.type === TransactionType.MONTHLY) && 
      t.dueDate && t.dueDate < now
    );
  }
}