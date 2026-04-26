import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { IGroupInviteRepository } from '../domain/repositories/IGroupInviteRepository.js';
import { INotificationRepository } from '../domain/repositories/INotificationRepository.js';
import { IWhatsAppService } from '../domain/services/IWhatsAppService.js';
import { GroupInvite } from '../domain/entities/GroupInvite.js';
import { Notification } from '../domain/entities/Notification.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

export interface InviteAthleteToGroupInput {
  adminId: string;
  groupId: string;
  athleteId: string;
}

export interface InviteAthleteToGroupOutput {
  inviteId: string;
  status: string;
}

export class InviteAthleteToGroupUseCase {
  constructor(
    private groupRepository: IGroupRepository,
    private athleteRepository: IAthleteRepository,
    private inviteRepository: IGroupInviteRepository,
    private notificationRepository: INotificationRepository,
    private whatsAppService: IWhatsAppService,
  ) {}

  async execute(input: InviteAthleteToGroupInput): Promise<InviteAthleteToGroupOutput> {
    const { adminId, groupId, athleteId } = input;

    const group = await this.groupRepository.findById(groupId);
    if (!group) throw new EntityNotFoundError('Group', groupId);

    if (!group.isAdmin(adminId)) {
      throw new BusinessRuleViolationError('Only administrators can invite athletes to this group');
    }

    const athlete = await this.athleteRepository.findById(athleteId);
    if (!athlete) throw new EntityNotFoundError('Athlete', athleteId);

    if (group.isMensalista(athleteId)) {
      throw new BusinessRuleViolationError('Athlete is already a member of this group');
    }

    const existing = await this.inviteRepository.findByGroupAndAthlete(groupId, athleteId);
    if (existing?.status === 'PENDING') {
      throw new BusinessRuleViolationError('A pending invite already exists for this athlete');
    }

    const invite = new GroupInvite(groupId, adminId, athleteId);
    await this.inviteRepository.save(invite);

    const notification = new Notification(
      athleteId,
      'GROUP_INVITE',
      `Convite para o grupo "${group.name}"`,
      `Você foi convidado para participar do grupo "${group.name}". Aceite ou recuse o convite.`,
      invite.id,
    );
    await this.notificationRepository.save(notification);

    await this.whatsAppService.sendMessage(
      athlete.phone,
      `Olá, ${athlete.name}! Você recebeu um convite para participar do grupo "${group.name}" no Soccer Manager. Abra o app para aceitar ou recusar.`,
    );

    return { inviteId: invite.id, status: invite.status };
  }
}
