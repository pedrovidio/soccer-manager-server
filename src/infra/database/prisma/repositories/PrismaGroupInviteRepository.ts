import { PrismaClient } from '@prisma/client';
import { GroupInvite } from '../../../../core/domain/entities/GroupInvite.js';
import { IGroupInviteRepository } from '../../../../core/domain/repositories/IGroupInviteRepository.js';
import { PrismaGroupInviteMapper } from '../mappers/PrismaGroupInviteMapper.js';

export class PrismaGroupInviteRepository implements IGroupInviteRepository {
  constructor(private prisma: PrismaClient) {}

  async save(invite: GroupInvite): Promise<void> {
    const data = PrismaGroupInviteMapper.toPrisma(invite);
    await this.prisma.groupInvite.upsert({
      where: { id: invite.id },
      update: data,
      create: data,
    });
  }

  async findById(id: string): Promise<GroupInvite | null> {
    const raw = await this.prisma.groupInvite.findUnique({ where: { id } });
    return raw ? PrismaGroupInviteMapper.toDomain(raw as any) : null;
  }

  async findByGroupAndAthlete(groupId: string, athleteId: string): Promise<GroupInvite | null> {
    const raw = await this.prisma.groupInvite.findUnique({
      where: { groupId_athleteId: { groupId, athleteId } },
    });
    return raw ? PrismaGroupInviteMapper.toDomain(raw as any) : null;
  }

  async findPendingByAthlete(athleteId: string): Promise<GroupInvite[]> {
    const results = await this.prisma.groupInvite.findMany({
      where: { athleteId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    return results.map((r) => PrismaGroupInviteMapper.toDomain(r as any));
  }

  async findByGroup(groupId: string): Promise<GroupInvite[]> {
    const results = await this.prisma.groupInvite.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
    });
    return results.map((r) => PrismaGroupInviteMapper.toDomain(r as any));
  }
}
