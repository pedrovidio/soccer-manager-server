import { randomUUID } from 'crypto';
import { BusinessRuleViolationError } from '../errors/BusinessRuleViolationError.js';

export type MatchInviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type MatchInviteType   = 'MEMBER' | 'SPOT';

export class MatchInvite {
  public readonly id: string;
  public readonly matchId: string;
  public readonly athleteId: string;
  public readonly inviteType: MatchInviteType;
  public status: MatchInviteStatus;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    matchId: string,
    athleteId: string,
    inviteType: MatchInviteType,
    status: MatchInviteStatus = 'PENDING',
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.id         = id ?? randomUUID();
    this.matchId    = matchId;
    this.athleteId  = athleteId;
    this.inviteType = inviteType;
    this.status     = status;
    this.createdAt  = createdAt ?? new Date();
    this.updatedAt  = updatedAt ?? new Date();
  }

  public accept(): void {
    this.ensurePending();
    this.status    = 'ACCEPTED';
    this.updatedAt = new Date();
  }

  public decline(): void {
    this.ensurePending();
    this.status    = 'DECLINED';
    this.updatedAt = new Date();
  }

  private ensurePending(): void {
    if (this.status !== 'PENDING') {
      throw new BusinessRuleViolationError(`Match invite is already ${this.status.toLowerCase()}`);
    }
  }
}
