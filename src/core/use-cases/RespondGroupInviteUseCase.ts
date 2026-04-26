import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IGroupInviteRepository } from '../domain/repositories/IGroupInviteRepository.js';
import { INotificationRepository } from '../domain/repositories/INotificationRepository.js';
import { Notification } from '../domain/entities/Notification.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

export interface RespondGroupInviteInput {
  athleteId: string;
  inviteId: string;
  accept: boolean;
}

export interface RespondGroupInviteOutput {
  inviteId: string;
  status: string;
}

export class RespondGroupInviteUseCase {
  constructor(
    private groupRepository: IGroupRepository,
    private inviteRepository: IGroupInviteRepository,
    private notificationRepository: INotificationRepository,
  ) {}

  async execute(input: RespondGroupInviteInput): Promise<RespondGroupInviteOutput> {
    const { athleteId, inviteId, accept } = input;

    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite) throw new EntityNotFoundError('GroupInvite', inviteId);

    if (invite.athleteId !== athleteId) {
      throw new BusinessRuleViolationError('This invite does not belong to you');
    }

    const group = await this.groupRepository.findById(invite.groupId);
    if (!group) throw new EntityNotFoundError('Group', invite.groupId);

    if (accept) {
      invite.accept();
      group.addMensalista(athleteId);
      await this.groupRepository.save(group);
    } else {
      invite.decline();
    }

    await this.inviteRepository.save(invite);

    const adminId = group.adminIds[0];
    if (adminId) {
      const notification = new Notification(
        adminId,
        accept ? 'INVITE_ACCEPTED' : 'INVITE_DECLINED',
        accept ? 'Convite aceito' : 'Convite recusado',
        accept
          ? `Um atleta aceitou o convite para o grupo "${group.name}".`
          : `Um atleta recusou o convite para o grupo "${group.name}".`,
        invite.id,
      );
      await this.notificationRepository.save(notification);
    }

    return { inviteId: invite.id, status: invite.status };
  }
}
