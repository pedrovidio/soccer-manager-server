import { GroupInvite } from '../entities/GroupInvite.js';

export interface IGroupInviteRepository {
  save(invite: GroupInvite): Promise<void>;
  findById(id: string): Promise<GroupInvite | null>;
  findByGroupAndAthlete(groupId: string, athleteId: string): Promise<GroupInvite | null>;
  findPendingByAthlete(athleteId: string): Promise<GroupInvite[]>;
}
