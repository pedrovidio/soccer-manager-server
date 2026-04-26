import { IFinancialRepository, GroupBalanceFilters } from '../../../../core/domain/repositories/IFinancialRepository.js';
import { FinancialTransaction, TransactionType, TransactionStatus } from '../../../../core/domain/entities/FinancialTransaction.js';
import { prisma } from '../client.js';

export class PrismaFinancialRepository implements IFinancialRepository {
  async save(transaction: FinancialTransaction): Promise<void> {
    await prisma.financialTransaction.upsert({
      where: { id: transaction.id },
      update: {
        status:      transaction.status,
        amount:      transaction.amount,
        platformFee: transaction.platformFee,
      },
      create: {
        id:          transaction.id,
        athleteId:   transaction.athleteId,
        matchId:     transaction.matchId,
        groupId:     null,
        amount:      transaction.amount,
        type:        transaction.type,
        status:      transaction.status,
        platformFee: transaction.platformFee,
        createdAt:   transaction.createdAt,
      },
    });
  }

  async findByAthleteId(athleteId: string): Promise<FinancialTransaction[]> {
    const rows = await prisma.financialTransaction.findMany({ where: { athleteId } });
    return rows.map(toDomain);
  }

  async findByGroupId(groupId: string, filters?: GroupBalanceFilters): Promise<FinancialTransaction[]> {
    const rows = await prisma.financialTransaction.findMany({
      where: {
        groupId,
        ...(filters?.from || filters?.to ? {
          createdAt: {
            ...(filters.from && { gte: filters.from }),
            ...(filters.to   && { lte: filters.to }),
          },
        } : {}),
      },
    });
    return rows.map(toDomain);
  }
}

function toDomain(row: any): FinancialTransaction {
  return new FinancialTransaction(
    row.type        as TransactionType,
    row.amount,
    row.platformFee,
    row.athleteId,
    row.matchId ?? '',
    row.status      as TransactionStatus,
    row.id,
    row.createdAt,
    row.dueDate     ?? undefined,
  );
}
