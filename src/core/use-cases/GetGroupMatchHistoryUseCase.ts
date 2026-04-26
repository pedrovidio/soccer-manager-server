import { IMatchHistoryRepository, MatchHistoryFilters, PaginatedResult, MatchHistoryItem } from '../domain/repositories/IMatchHistoryRepository.js';
import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

interface Input {
  groupId: string;
  requesterId: string;
  filters: MatchHistoryFilters;
}

export class GetGroupMatchHistoryUseCase {
  constructor(
    private groupRepository: IGroupRepository,
    private historyRepository: IMatchHistoryRepository,
  ) {}

  async execute({ groupId, requesterId, filters }: Input): Promise<PaginatedResult<MatchHistoryItem>> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) throw new EntityNotFoundError('Group', groupId);

    const isMember = group.isAdmin(requesterId) || group.isMensalista(requesterId);
    if (!isMember) throw new BusinessRuleViolationError('Only group members can view match history');

    return this.historyRepository.listByGroup(groupId, filters);
  }
}
