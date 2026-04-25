import { DomainError } from './DomainError.js';

/**
 * Exceção lançada quando uma entidade não é encontrada no repositório.
 */
export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, identifier: string) {
    super(
      `${entityName} with identifier "${identifier}" not found`,
      'ENTITY_NOT_FOUND'
    );
    this.name = 'EntityNotFoundError';
    Object.setPrototypeOf(this, EntityNotFoundError.prototype);
  }
}
