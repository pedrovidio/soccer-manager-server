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
}
