import { randomUUID } from 'crypto';

export enum TransactionType {
  GOALKEEPER_SERVICE = 'GOALKEEPER_SERVICE',
  SPOT = 'SPOT',
  MONTHLY = 'MONTHLY',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export class FinancialTransaction {
  public readonly id: string;
  public readonly type: TransactionType;
  public readonly status: TransactionStatus;
  public readonly amount: number;
  public readonly platformFee: number;
  public readonly athleteId: string;
  public readonly matchId: string;
  public readonly createdAt: Date;
  public readonly dueDate: Date | undefined;

  constructor(
    type: TransactionType,
    amount: number,
    platformFee: number,
    athleteId: string,
    matchId: string,
    status: TransactionStatus = TransactionStatus.PENDING,
    id?: string,
    createdAt?: Date,
    dueDate?: Date,
  ) {
    this.id = id ?? randomUUID();
    this.type = type;
    this.status = status;
    this.amount = amount;
    this.platformFee = platformFee;
    this.athleteId = athleteId;
    this.matchId = matchId;
    this.createdAt = createdAt ?? new Date();
    this.dueDate = dueDate;

    // Validações
    if (amount <= 0) throw new Error('Amount must be positive');
    if (platformFee < 0) throw new Error('Platform fee cannot be negative');
    if ((type === TransactionType.SPOT || type === TransactionType.MONTHLY) && !dueDate) {
      throw new Error('Due date is required for SPOT and MONTHLY transactions');
    }
  }
}