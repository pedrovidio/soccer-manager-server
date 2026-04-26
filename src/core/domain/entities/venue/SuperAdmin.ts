import { randomUUID } from 'crypto';

export class SuperAdmin {
  public readonly id: string;
  public readonly email: string;
  public passwordHash: string;
  public pixKey: string | undefined;
  public asaasWalletId: string | undefined;
  public commissionRate: number;

  constructor(
    email: string,
    passwordHash: string,
    id?: string,
    pixKey?: string,
    asaasWalletId?: string,
    commissionRate: number = 0.1,
  ) {
    this.id = id ?? randomUUID();
    this.email = email;
    this.passwordHash = passwordHash;
    this.pixKey = pixKey;
    this.asaasWalletId = asaasWalletId;
    this.commissionRate = commissionRate;
  }

  public updateCommissionRate(rate: number): void {
    if (rate < 0 || rate > 1) throw new Error('Commission rate must be between 0 and 1');
    this.commissionRate = rate;
  }
}
