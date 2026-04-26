import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { IGroupAdminDelegationRepository } from '../domain/repositories/IGroupAdminDelegationRepository.js';
import { GroupAdminDelegation } from '../domain/entities/GroupAdminDelegation.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

interface Input {
  groupId: string;
  requesterId: string;
  delegatedTo: string;
  isPermanent: boolean;
  matchesLimit?: number;
}

interface Output {
  delegationId: string;
  isPermanent: boolean;
  matchesLimit: number | undefined;
}

export class DelegateGroupAdminUseCase {
  constructor(
    private groupRepository: IGroupRepository,
    private athleteRepository: IAthleteRepository,
    private delegationRepository: IGroupAdminDelegationRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const group = await this.groupRepository.findById(input.groupId);
    if (!group) throw new EntityNotFoundError('Group', input.groupId);
    if (!group.isAdmin(input.requesterId)) throw new BusinessRuleViolationError('Only admins can delegate admin role');

    const target = await this.athleteRepository.findById(input.delegatedTo);
    if (!target) throw new EntityNotFoundError('Athlete', input.delegatedTo);

    const isMember = group.isMensalista(input.delegatedTo) || group.isAdmin(input.delegatedTo);
    if (!isMember) throw new BusinessRuleViolationError('Athlete must be a group member to become admin');

    const existing = await this.delegationRepository.findActiveByGroupAndDelegate(input.groupId, input.delegatedTo);
    if (existing) throw new BusinessRuleViolationError('Athlete already has an active admin delegation in this group');

    const delegation = new GroupAdminDelegation(
      input.groupId,
      input.requesterId,
      input.delegatedTo,
      input.isPermanent,
      input.isPermanent ? undefined : input.matchesLimit,
    );

    group.adminIds.push(input.delegatedTo);
    await this.groupRepository.save(group);
    await this.delegationRepository.save(delegation);

    return {
      delegationId: delegation.id,
      isPermanent: delegation.isPermanent,
      matchesLimit: delegation.matchesLimit,
    };
  }
}
