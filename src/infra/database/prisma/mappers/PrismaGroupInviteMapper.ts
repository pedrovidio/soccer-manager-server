import { GroupInvite, InviteStatus } from '../../../../core/domain/entities/GroupInvite.js';

interface PrismaGroupInviteRaw {
  id: string;
  groupId: string;
  invitedBy: string;
  athleteId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaGroupInviteMapper {
  static toDomain(raw: PrismaGroupInviteRaw): GroupInvite {
    return new GroupInvite(
      raw.groupId,
      raw.invitedBy,
      raw.athleteId,
      raw.status as InviteStatus,
      raw.id,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  static toPrisma(invite: GroupInvite) {
    return {
      id: invite.id,
      groupId: invite.groupId,
      invitedBy: invite.invitedBy,
      athleteId: invite.athleteId,
      status: invite.status,
      createdAt: invite.createdAt,
      updatedAt: invite.updatedAt,
    };
  }
}
