import { randomUUID } from 'crypto';
import { BusinessRuleViolationError } from '../errors/BusinessRuleViolationError.js';

export class GroupAdminDelegation {
  public readonly id: string;
  public readonly groupId: string;
  public readonly delegatedBy: string;
  public readonly delegatedTo: string;
  public readonly isPermanent: boolean;
  public readonly matchesLimit: number | undefined;
  public matchesConsumed: number;
  public revokedAt: Date | undefined;
  public readonly createdAt: Date;

  constructor(
    groupId: string,
    delegatedBy: string,
    delegatedTo: string,
    isPermanent: boolean,
    matchesLimit?: number,
    id?: string,
    matchesConsumed: number = 0,
    revokedAt?: Date,
    createdAt?: Date,
  ) {
    if (!isPermanent && (matchesLimit === undefined || matchesLimit < 1)) {
      throw new BusinessRuleViolationError('Temporary delegation requires matchesLimit >= 1');
    }

    this.id = id ?? randomUUID();
    this.groupId = groupId;
    this.delegatedBy = delegatedBy;
    this.delegatedTo = delegatedTo;
    this.isPermanent = isPermanent;
    this.matchesLimit = matchesLimit;
    this.matchesConsumed = matchesConsumed;
    this.revokedAt = revokedAt;
    this.createdAt = createdAt ?? new Date();
  }

  public get isActive(): boolean {
    return this.revokedAt === undefined;
  }

  public consumeMatch(): void {
    if (!this.isActive) throw new BusinessRuleViolationError('Delegation is already revoked');
    if (this.isPermanent) return;
    this.matchesConsumed++;
    if (this.matchesConsumed >= this.matchesLimit!) {
      this.revokedAt = new Date();
    }
  }

  public revoke(): void {
    if (!this.isActive) throw new BusinessRuleViolationError('Delegation is already revoked');
    this.revokedAt = new Date();
  }
}
