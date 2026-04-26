import { randomUUID } from 'crypto';
import { BusinessRuleViolationError } from '../errors/BusinessRuleViolationError.js';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export class GroupInvite {
  public readonly id: string;
  public readonly groupId: string;
  public readonly invitedBy: string;
  public readonly athleteId: string;
  public status: InviteStatus;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    groupId: string,
    invitedBy: string,
    athleteId: string,
    status: InviteStatus = 'PENDING',
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.id = id ?? randomUUID();
    this.groupId = groupId;
    this.invitedBy = invitedBy;
    this.athleteId = athleteId;
    this.status = status;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  public accept(): void {
    this.ensurePending();
    this.status = 'ACCEPTED';
    this.updatedAt = new Date();
  }

  public decline(): void {
    this.ensurePending();
    this.status = 'DECLINED';
    this.updatedAt = new Date();
  }

  private ensurePending(): void {
    if (this.status !== 'PENDING') {
      throw new BusinessRuleViolationError(`Invite is already ${this.status.toLowerCase()}`);
    }
  }
}
