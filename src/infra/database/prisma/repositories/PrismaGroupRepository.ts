import { PrismaClient } from '@prisma/client';
import { Group } from '../../../../core/domain/entities/Group.js';
import { IGroupRepository } from '../../../../core/domain/repositories/IGroupRepository.js';
import { PrismaGroupMapper } from '../mappers/PrismaGroupMapper.js';

export class PrismaGroupRepository implements IGroupRepository {
  constructor(private prisma: PrismaClient) {}

  async save(group: Group): Promise<void> {
    const data = PrismaGroupMapper.toPrisma(group);

    await this.prisma.group.upsert({
      where: { id: group.id },
      update: data,
      create: data,
    });
  }

  async findById(id: string): Promise<Group | null> {
    const raw = await this.prisma.group.findUnique({
      where: { id },
    });

    return raw ? PrismaGroupMapper.toDomain(raw as any) : null;
  }

  async listByAdmin(adminId: string): Promise<Group[]> {
    const results = await this.prisma.group.findMany({
      where: { adminIds: { has: adminId } },
    });
    return results.map((raw) => PrismaGroupMapper.toDomain(raw as any));
  }

  async listByMember(athleteId: string): Promise<Group[]> {
    const results = await this.prisma.group.findMany({
      where: { memberIds: { has: athleteId } },
    });
    return results.map((raw) => PrismaGroupMapper.toDomain(raw as any));
  }

  async setMemberBlocked(groupId: string, athleteId: string, isBlocked: boolean): Promise<void> {
    await this.prisma.groupMemberStatus.upsert({
      where: { groupId_athleteId: { groupId, athleteId } },
      update: { isBlocked },
      create: { groupId, athleteId, isBlocked },
    });
  }

  async getMemberBlockedStatus(groupId: string, athleteIds: string[]): Promise<Record<string, boolean>> {
    const statuses = await this.prisma.groupMemberStatus.findMany({
      where: { groupId, athleteId: { in: athleteIds } },
    });
    const map: Record<string, boolean> = {};
    for (const s of statuses) map[s.athleteId] = s.isBlocked;
    return map;
  }

  async removeMember(groupId: string, athleteId: string): Promise<void> {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return;
    await this.prisma.group.update({
      where: { id: groupId },
      data: {
        memberIds: group.memberIds.filter((id) => id !== athleteId),
        adminIds:  group.adminIds.filter((id) => id !== athleteId),
      },
    });
    await this.prisma.groupMemberStatus.deleteMany({ where: { groupId, athleteId } });
  }
}
