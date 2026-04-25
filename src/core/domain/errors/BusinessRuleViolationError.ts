import { DomainError } from './DomainError.js';

/**
 * Exceção lançada quando uma regra de negócio é violada.
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
    this.name = 'BusinessRuleViolationError';
    Object.setPrototypeOf(this, BusinessRuleViolationError.prototype);
  }
}
