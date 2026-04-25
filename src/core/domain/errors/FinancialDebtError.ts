import { DomainError } from './DomainError.js';

/**
 * Exceção lançada quando um atleta possui pendências financeiras.
 */
export class FinancialDebtError extends DomainError {
  constructor() {
    super(
      'Athlete has pending financial debts and is blocked from this action',
      'FINANCIAL_DEBT'
    );
  }
}
