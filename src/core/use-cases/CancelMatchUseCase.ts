import { Notification } from '../domain/entities/Notification.js';
import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';
import { IMatchInviteRepository } from '../domain/repositories/IMatchInviteRepository.js';
import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { INotificationRepository } from '../domain/repositories/INotificationRepository.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

interface Input {
  matchId: string;
  adminId: string;
  reason: string;
}

export class CancelMatchUseCase {
  constructor(
    private matchRepository: IMatchRepository,
    private matchInviteRepository: IMatchInviteRepository,
    private groupRepository: IGroupRepository,
    private athleteRepository: IAthleteRepository,
    private notificationRepository: INotificationRepository,
  ) {}

  async execute({ matchId, adminId, reason }: Input): Promise<void> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) throw new EntityNotFoundError('Match', matchId);

    const group = await this.groupRepository.findById(match.groupId);
    if (!group) throw new EntityNotFoundError('Group', match.groupId);
    if (!group.isAdmin(adminId)) throw new BusinessRuleViolationError('Only admins can cancel a match');

    match.cancel();
    await this.matchRepository.save(match);

    // Collect all athletes to notify: confirmed + accepted invites
    const invites = await this.matchInviteRepository.findByMatch(matchId);
    const acceptedAthleteIds = invites
      .filter((i) => i.status === 'ACCEPTED')
      .map((i) => i.athleteId);

    const athleteIds = [...new Set([...match.confirmedIds, ...acceptedAthleteIds])];
    if (athleteIds.length === 0) return;

    const typeLabel = { CAMPO: 'Campo', SOCIETY: 'Society', FUTSAL: 'Futsal' }[match.type];
    const dateStr = match.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = match.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    await Promise.all(
      athleteIds.map((athleteId) =>
        this.notificationRepository.save(new Notification(
          athleteId,
          'SYSTEM',
          `Jogo cancelado — ${typeLabel} ${dateStr}`,
          `O jogo de ${typeLabel} em ${match.location} às ${timeStr} do dia ${dateStr} foi cancelado.\n\nMotivo: ${reason}`,
          matchId,
        )),
      ),
    );
  }
}
