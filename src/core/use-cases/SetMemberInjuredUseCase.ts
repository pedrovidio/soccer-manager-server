import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

interface Input {
  groupId: string;
  requesterId: string;
  athleteId: string;
  isInjured: boolean;
}

export class SetMemberInjuredUseCase {
  constructor(
    private groupRepo: IGroupRepository,
    private athleteRepo: IAthleteRepository,
  ) {}

  async execute({ groupId, requesterId, athleteId, isInjured }: Input): Promise<void> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new EntityNotFoundError('Group', groupId);
    if (!group.isAdmin(requesterId)) throw new BusinessRuleViolationError('Only admins can update injury status');
    if (!group.memberIds.includes(athleteId) && !group.adminIds.includes(athleteId)) {
      throw new EntityNotFoundError('Athlete', athleteId);
    }
    await this.athleteRepo.updateInjuredStatus(athleteId, isInjured);
  }
}
