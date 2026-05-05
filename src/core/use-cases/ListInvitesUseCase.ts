import { IGroupInviteRepository } from '../domain/repositories/IGroupInviteRepository.js';
import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IMatchInviteRepository } from '../domain/repositories/IMatchInviteRepository.js';
import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';

export interface ListInvitesInput {
  athleteId: string;
}

export interface InviteOutput {
  id: string;
  type: 'GROUP' | 'MATCH';
  // group invite fields
  groupId?: string;
  groupName?: string;
  invitedBy?: string;
  // match invite fields
  matchId?: string;
  matchDate?: Date | undefined;
  matchLocation?: string | undefined;
  matchGroupName?: string;
  // common
  status: string;
  createdAt: Date;
  respondUrl: string;
}

export class ListInvitesUseCase {
  constructor(
    private inviteRepository: IGroupInviteRepository,
    private groupRepository: IGroupRepository,
    private matchInviteRepository: IMatchInviteRepository,
    private matchRepository: IMatchRepository,
  ) {}

  async execute(input: ListInvitesInput): Promise<InviteOutput[]> {
    const [groupInvites, matchInvites] = await Promise.all([
      this.inviteRepository.findPendingByAthlete(input.athleteId),
      this.matchInviteRepository.findPendingByAthlete(input.athleteId),
    ]);

    const groupResults = await Promise.all(
      groupInvites.map(async (i): Promise<InviteOutput> => {
        const group = await this.groupRepository.findById(i.groupId);
        return {
          id: i.id,
          type: 'GROUP',
          groupId: i.groupId,
          groupName: group?.name ?? 'Unknown',
          invitedBy: i.invitedBy,
          status: i.status,
          createdAt: i.createdAt,
          respondUrl: `/invites/${i.id}/respond`,
        };
      }),
    );

    const matchResults = await Promise.all(
      matchInvites.map(async (i): Promise<InviteOutput> => {
        const match = await this.matchRepository.findById(i.matchId);
        const group = match ? await this.groupRepository.findById(match.groupId) : null;
        return {
          id: i.id,
          type: 'MATCH',
          matchId: i.matchId,
          matchDate: match?.date,
          matchLocation: match?.location,
          matchGroupName: group?.name ?? 'Unknown',
          status: i.status,
          createdAt: i.createdAt,
          respondUrl: `/match-invites/${i.id}/respond`,
        };
      }),
    );

    return [...groupResults, ...matchResults].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}
