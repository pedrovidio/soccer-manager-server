import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

interface Input {
  groupId: string;
  requesterId: string;
  athleteId: string;
  isBlocked: boolean;
}


export class SetMemberBlockedUseCase {
  constructor(private groupRepo: IGroupRepository) {}

  async execute({ groupId, requesterId, athleteId, isBlocked }: Input): Promise<void> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new EntityNotFoundError('Group', groupId);
    if (!group.isAdmin(requesterId)) throw new BusinessRuleViolationError('Only admins can block/unblock members');
    if (!group.memberIds.includes(athleteId) && !group.adminIds.includes(athleteId)) {
      throw new EntityNotFoundError('Athlete', athleteId);
    }
    await this.groupRepo.setMemberBlocked(groupId, athleteId, isBlocked);
  }
}
