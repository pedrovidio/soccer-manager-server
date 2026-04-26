import { randomUUID } from 'crypto';
import { BusinessRuleViolationError } from '../../errors/BusinessRuleViolationError.js';

export type VenueOwnerStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class VenueOwner {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;
  public readonly phone: string;
  public readonly cpfCnpj: string;
  public passwordHash: string;
  public status: VenueOwnerStatus;
  public asaasWalletId: string | undefined;
  public pixKey: string | undefined;
  public readonly createdAt: Date;

  constructor(
    name: string,
    email: string,
    phone: string,
    cpfCnpj: string,
    passwordHash: string,
    id?: string,
    status: VenueOwnerStatus = 'PENDING',
    asaasWalletId?: string,
    pixKey?: string,
    createdAt?: Date,
  ) {
    this.id = id ?? randomUUID();
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.cpfCnpj = cpfCnpj;
    this.passwordHash = passwordHash;
    this.status = status;
    this.asaasWalletId = asaasWalletId;
    this.pixKey = pixKey;
    this.createdAt = createdAt ?? new Date();
  }

  public approve(): void {
    if (this.status !== 'PENDING') throw new BusinessRuleViolationError('Only pending venue owners can be approved');
    this.status = 'APPROVED';
  }

  public reject(): void {
    if (this.status !== 'PENDING') throw new BusinessRuleViolationError('Only pending venue owners can be rejected');
    this.status = 'REJECTED';
  }

  public isApproved(): boolean {
    return this.status === 'APPROVED';
  }
}
