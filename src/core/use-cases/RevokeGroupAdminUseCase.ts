import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IGroupAdminDelegationRepository } from '../domain/repositories/IGroupAdminDelegationRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

interface Input {
  groupId: string;
  requesterId: string;
  delegatedTo: string;
}

export class RevokeGroupAdminUseCase {
  constructor(
    private groupRepository: IGroupRepository,
    private delegationRepository: IGroupAdminDelegationRepository,
  ) {}

  async execute({ groupId, requesterId, delegatedTo }: Input): Promise<void> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) throw new EntityNotFoundError('Group', groupId);
    if (!group.isAdmin(requesterId)) throw new BusinessRuleViolationError('Only admins can revoke admin delegation');
    if (requesterId === delegatedTo) throw new BusinessRuleViolationError('Admin cannot revoke their own permanent role');

    const delegation = await this.delegationRepository.findActiveByGroupAndDelegate(groupId, delegatedTo);
    if (!delegation) throw new EntityNotFoundError('Active delegation', delegatedTo);

    delegation.revoke();
    group.adminIds = group.adminIds.filter((id) => id !== delegatedTo);

    await this.delegationRepository.save(delegation);
    await this.groupRepository.save(group);
  }
}
