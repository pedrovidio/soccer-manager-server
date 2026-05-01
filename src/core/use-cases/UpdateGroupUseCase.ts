import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { GoalkeeperPaymentMode } from '../domain/entities/Group.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

export interface UpdateGroupInput {
  groupId: string;
  requesterId: string;
  name?: string;
  description?: string;
  pixKey?: string;
  monthlyFee?: number;
  goalkeeperPaymentMode?: GoalkeeperPaymentMode;
}

export class UpdateGroupUseCase {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(input: UpdateGroupInput): Promise<void> {
    const group = await this.groupRepository.findById(input.groupId);
    if (!group) throw new EntityNotFoundError('Group', input.groupId);

    if (!group.isAdmin(input.requesterId)) {
      throw new BusinessRuleViolationError('Only administrators can edit this group');
    }

    if (input.name !== undefined)                  group.name = input.name;
    if (input.description !== undefined)           group.description = input.description;
    if (input.pixKey !== undefined)                group.pixKey = input.pixKey;
    if (input.monthlyFee !== undefined)            group.monthlyFee = input.monthlyFee;
    if (input.goalkeeperPaymentMode !== undefined) group.goalkeeperPaymentMode = input.goalkeeperPaymentMode;

    await this.groupRepository.save(group);
  }
}
