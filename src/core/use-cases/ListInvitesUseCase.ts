import { IGroupInviteRepository } from '../domain/repositories/IGroupInviteRepository.js';
import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';

export interface ListInvitesInput {
  athleteId: string;
}

export interface InviteOutput {
  id: string;
  groupId: string;
  groupName: string;
  invitedBy: string;
  status: string;
  createdAt: Date;
}

export class ListInvitesUseCase {
  constructor(
    private inviteRepository: IGroupInviteRepository,
    private groupRepository: IGroupRepository,
  ) {}

  async execute(input: ListInvitesInput): Promise<InviteOutput[]> {
    const invites = await this.inviteRepository.findPendingByAthlete(input.athleteId);

    const groups = await Promise.all(
      invites.map((i) => this.groupRepository.findById(i.groupId)),
    );

    return invites.map((invite, idx) => ({
      id: invite.id,
      groupId: invite.groupId,
      groupName: groups[idx]?.name ?? 'Unknown',
      invitedBy: invite.invitedBy,
      status: invite.status,
      createdAt: invite.createdAt,
    }));
  }
}
