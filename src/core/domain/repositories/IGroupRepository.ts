import { Group } from '../entities/Group.js';

export interface IGroupRepository {
  save(group: Group): Promise<void>;
  findById(id: string): Promise<Group | null>;
  listByAdmin(adminId: string): Promise<Group[]>;
  listByMember(athleteId: string): Promise<Group[]>;
}
