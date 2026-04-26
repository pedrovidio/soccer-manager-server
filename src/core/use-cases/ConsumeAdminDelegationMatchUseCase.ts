import { IGroupAdminDelegationRepository } from '../domain/repositories/IGroupAdminDelegationRepository.js';
import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';

interface Input {
  groupId: string;
}

export class ConsumeAdminDelegationMatchUseCase {
  constructor(
    private groupRepository: IGroupRepository,
    private delegationRepository: IGroupAdminDelegationRepository,
  ) {}

  async execute({ groupId }: Input): Promise<void> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) return;

    const activeDelegations = await this.delegationRepository.findActiveByGroup(groupId);
    const temporary = activeDelegations.filter((d) => !d.isPermanent);

    for (const delegation of temporary) {
      delegation.consumeMatch();
      await this.delegationRepository.save(delegation);

      // If delegation expired, remove from adminIds
      if (!delegation.isActive) {
        group.adminIds = group.adminIds.filter((id) => id !== delegation.delegatedTo);
      }
    }

    if (temporary.some((d) => !d.isActive)) {
      await this.groupRepository.save(group);
    }
  }
}
