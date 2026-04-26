import { GroupAdminDelegation } from '../entities/GroupAdminDelegation.js';

export interface IGroupAdminDelegationRepository {
  save(delegation: GroupAdminDelegation): Promise<void>;
  findActiveByGroup(groupId: string): Promise<GroupAdminDelegation[]>;
  findActiveByGroupAndDelegate(groupId: string, delegatedTo: string): Promise<GroupAdminDelegation | null>;
}
