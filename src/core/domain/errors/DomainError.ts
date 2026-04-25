/**
 * Classe base para todas as exceções de domínio.
 * Garante que erros de negócio sejam tratados de forma consistente.
 */
export class DomainError extends Error {
  constructor(public readonly message: string, public readonly code: string) {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}
