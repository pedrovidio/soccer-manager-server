import { IAthleteRepository, AthleteSearchFilters } from '../domain/repositories/IAthleteRepository.js';
import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IGroupInviteRepository } from '../domain/repositories/IGroupInviteRepository.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

export interface SearchAthletesInput {
  name?: string;
  cpf?: string;
  email?: string;
  groupId?: string;
  requesterId?: string;
}

export interface SearchAthletesOutput {
  id: string;
  name: string;
  email: string;
  position: string;
  overall: number;
}

export class SearchAthletesUseCase {
  constructor(
    private athleteRepository: IAthleteRepository,
    private groupRepository?: IGroupRepository,
    private inviteRepository?: IGroupInviteRepository,
  ) {}

  async execute(input: SearchAthletesInput): Promise<SearchAthletesOutput[]> {
    if (!input.name && !input.cpf && !input.email) {
      throw new BusinessRuleViolationError('At least one search filter must be provided');
    }

    const filters: AthleteSearchFilters = {
      ...(input.name  && { name:  input.name }),
      ...(input.cpf   && { cpf:   input.cpf }),
      ...(input.email && { email: input.email }),
    };

    const athletes = await this.athleteRepository.search(filters);

    // Build exclusion set: requester + current members + PENDING/ACCEPTED invitees
    const excludeIds = new Set<string>();

    if (input.requesterId) excludeIds.add(input.requesterId);

    if (input.groupId && this.groupRepository && this.inviteRepository) {
      const group = await this.groupRepository.findById(input.groupId);
      if (group) {
        [...group.adminIds, ...group.memberIds].forEach((id) => excludeIds.add(id));
      }

      const invites = await this.inviteRepository.findByGroup(input.groupId);
      invites
        .filter((i) => i.status === 'PENDING' || i.status === 'ACCEPTED')
        .forEach((i) => excludeIds.add(i.athleteId));
    }

    return athletes
      .filter((a) => !excludeIds.has(a.id))
      .map((a) => ({
        id:       a.id,
        name:     a.name,
        email:    a.email,
        position: a.position,
        overall:  a.calculateOverall(),
      }));
  }
}
