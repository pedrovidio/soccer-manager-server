import { PrismaClient } from '@prisma/client';
import { GroupAdminDelegation } from '../../../../core/domain/entities/GroupAdminDelegation.js';
import { IGroupAdminDelegationRepository } from '../../../../core/domain/repositories/IGroupAdminDelegationRepository.js';

function toDomain(raw: any): GroupAdminDelegation {
  return new GroupAdminDelegation(
    raw.groupId,
    raw.delegatedBy,
    raw.delegatedTo,
    raw.isPermanent,
    raw.matchesLimit ?? undefined,
    raw.id,
    raw.matchesConsumed,
    raw.revokedAt ?? undefined,
    raw.createdAt,
  );
}

export class PrismaGroupAdminDelegationRepository implements IGroupAdminDelegationRepository {
  constructor(private prisma: PrismaClient) {}

  async save(delegation: GroupAdminDelegation): Promise<void> {
    await this.prisma.groupAdminDelegation.upsert({
      where: { id: delegation.id },
      update: {
        matchesConsumed: delegation.matchesConsumed,
        revokedAt: delegation.revokedAt ?? null,
      },
      create: {
        id: delegation.id,
        groupId: delegation.groupId,
        delegatedBy: delegation.delegatedBy,
        delegatedTo: delegation.delegatedTo,
        isPermanent: delegation.isPermanent,
        matchesLimit: delegation.matchesLimit ?? null,
        matchesConsumed: delegation.matchesConsumed,
        revokedAt: delegation.revokedAt ?? null,
        createdAt: delegation.createdAt,
      },
    });
  }

  async findActiveByGroup(groupId: string): Promise<GroupAdminDelegation[]> {
    const results = await this.prisma.groupAdminDelegation.findMany({
      where: { groupId, revokedAt: null },
    });
    return results.map(toDomain);
  }

  async findActiveByGroupAndDelegate(groupId: string, delegatedTo: string): Promise<GroupAdminDelegation | null> {
    const raw = await this.prisma.groupAdminDelegation.findFirst({
      where: { groupId, delegatedTo, revokedAt: null },
    });
    return raw ? toDomain(raw) : null;
  }
}
