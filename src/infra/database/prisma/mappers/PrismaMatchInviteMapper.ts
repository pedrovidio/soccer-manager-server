import { MatchInvite, MatchInviteStatus, MatchInviteType } from '../../../../core/domain/entities/MatchInvite.js';

export class PrismaMatchInviteMapper {
  static toDomain(raw: any): MatchInvite {
    return new MatchInvite(
      raw.matchId,
      raw.athleteId,
      raw.inviteType as MatchInviteType,
      raw.status as MatchInviteStatus,
      raw.id,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  static toPrisma(invite: MatchInvite) {
    return {
      id:         invite.id,
      matchId:    invite.matchId,
      athleteId:  invite.athleteId,
      inviteType: invite.inviteType,
      status:     invite.status,
      createdAt:  invite.createdAt,
      updatedAt:  invite.updatedAt,
    };
  }
}
