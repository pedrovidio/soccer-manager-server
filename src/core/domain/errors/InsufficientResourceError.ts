import { DomainError } from './DomainError.js';

/**
 * Exceção lançada quando um recurso (vaga, fundo, etc) é insuficiente.
 */
export class InsufficientResourceError extends DomainError {
  constructor(resourceName: string, required: number, available: number) {
    super(
      `Insufficient ${resourceName}. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_RESOURCE'
    );
    this.name = 'InsufficientResourceError';
    Object.setPrototypeOf(this, InsufficientResourceError.prototype);
  }
}
