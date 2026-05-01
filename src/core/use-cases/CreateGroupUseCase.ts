import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { Group } from '../domain/entities/Group.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';

export interface CreateGroupInput {
  adminId: string;
  name: string;
  description?: string;
  pixKey?: string;
  monthlyFee?: number;
  baseLocation?: { latitude: number; longitude: number };
  goalkeeperPaymentMode?: 'SPLIT' | 'MONTHLY' | 'FREE';
}

export interface CreateGroupOutput {
  id: string;
  name: string;
  description: string | undefined;
  adminIds: string[];
  memberIds: string[];
  pixKey: string | undefined;
  monthlyFee: number;
  status: string;
  goalkeeperPaymentMode: string;
}

export class CreateGroupUseCase {
  constructor(
    private groupRepository: IGroupRepository,
    private athleteRepository: IAthleteRepository,
  ) {}

  async execute(input: CreateGroupInput): Promise<CreateGroupOutput> {
    const admin = await this.athleteRepository.findById(input.adminId);
    if (!admin) throw new EntityNotFoundError('Athlete', input.adminId);

    const group = new Group(
      input.name,
      [input.adminId],
      [],
      undefined,
      input.baseLocation,
      input.pixKey,
      undefined,
      input.description,
      undefined,
      input.goalkeeperPaymentMode ?? 'SPLIT',
      input.monthlyFee ?? 0,
    );

    await this.groupRepository.save(group);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      adminIds: group.adminIds,
      memberIds: group.memberIds,
      pixKey: group.pixKey,
      monthlyFee: input.monthlyFee ?? 0,
      status: group.status,
      goalkeeperPaymentMode: group.goalkeeperPaymentMode,
    };
  }
}
