import { Notification } from '../domain/entities/Notification.js';
import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';
import { IMatchInviteRepository } from '../domain/repositories/IMatchInviteRepository.js';
import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { INotificationRepository } from '../domain/repositories/INotificationRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';
import { FinancialDebtError } from '../domain/errors/FinancialDebtError.js';

export interface RespondMatchInviteInput {
  athleteId: string;
  inviteId: string;
  accept: boolean;
}

export interface RespondMatchInviteOutput {
  inviteId: string;
  status: string;
  confirmedCount: number;
}

export class RespondMatchInviteUseCase {
  constructor(
    private matchRepository: IMatchRepository,
    private matchInviteRepository: IMatchInviteRepository,
    private groupRepository: IGroupRepository,
    private athleteRepository: IAthleteRepository,
    private notificationRepository: INotificationRepository,
  ) {}

  async execute(input: RespondMatchInviteInput): Promise<RespondMatchInviteOutput> {
    const { athleteId, inviteId, accept } = input;

    const invite = await this.matchInviteRepository.findById(inviteId);
    if (!invite) throw new EntityNotFoundError('MatchInvite', inviteId);

    if (invite.athleteId !== athleteId) {
      throw new BusinessRuleViolationError('This invite does not belong to you');
    }

    const athlete = await this.athleteRepository.findById(athleteId);
    if (!athlete) throw new EntityNotFoundError('Athlete', athleteId);

    if (accept) {
      if (athlete.financialDebt > 0) throw new FinancialDebtError();
      if (athlete.isInjured) throw new BusinessRuleViolationError('Injured athletes cannot confirm presence');
    }

    const match = await this.matchRepository.findById(invite.matchId);
    if (!match) throw new EntityNotFoundError('Match', invite.matchId);

    if (accept) {
      invite.accept();
      match.confirmPresence(athleteId);
      await this.matchRepository.save(match);
    } else {
      invite.decline();
    }

    await this.matchInviteRepository.save(invite);

    const group = await this.groupRepository.findById(match.groupId);
    const adminId = group?.adminIds[0];

    if (adminId) {
      await this.notificationRepository.save(new Notification(
        adminId,
        accept ? 'MATCH_INVITE_ACCEPTED' : 'MATCH_INVITE_DECLINED',
        accept ? 'Presença confirmada' : 'Presença recusada',
        accept
          ? `${athlete.name} confirmou presença no jogo em ${match.location}.`
          : `${athlete.name} recusou o convite para o jogo em ${match.location}.`,
        invite.id,
      ));
    }

    return { inviteId: invite.id, status: invite.status, confirmedCount: match.confirmedIds.length };
  }
}
