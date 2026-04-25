import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

export interface AddMemberToGroupInput {
  adminId: string;
  groupId: string;
  athleteId: string;
}

export interface AddMemberToGroupOutput {
  groupId: string;
  memberIds: string[];
}

export class AddMemberToGroupUseCase {
  constructor(
    private groupRepository: IGroupRepository,
    private athleteRepository: IAthleteRepository,
  ) {}

  async execute(input: AddMemberToGroupInput): Promise<AddMemberToGroupOutput> {
    const { adminId, groupId, athleteId } = input;

    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new EntityNotFoundError('Group', groupId);
    }

    if (!group.isAdmin(adminId)) {
      throw new BusinessRuleViolationError('Only administrators can add members to this group');
    }

    const athlete = await this.athleteRepository.findById(athleteId);
    if (!athlete) {
      throw new EntityNotFoundError('Athlete', athleteId);
    }

    group.addMensalista(athleteId);
    await this.groupRepository.save(group);

    return {
      groupId: group.id,
      memberIds: [...group.memberIds],
    };
  }
}
