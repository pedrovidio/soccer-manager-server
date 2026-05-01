import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

interface Input {
  groupId: string;
  requesterId: string;
  athleteId: string;
}

export class RemoveMemberUseCase {
  constructor(private groupRepo: IGroupRepository) {}

  async execute({ groupId, requesterId, athleteId }: Input): Promise<void> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new EntityNotFoundError('Group', groupId);
    if (!group.isAdmin(requesterId)) throw new BusinessRuleViolationError('Only admins can remove members');
    if (group.adminIds.includes(athleteId) && group.adminIds.length === 1) {
      throw new BusinessRuleViolationError('Cannot remove the last admin of the group');
    }
    await this.groupRepo.removeMember(groupId, athleteId);
  }
}
