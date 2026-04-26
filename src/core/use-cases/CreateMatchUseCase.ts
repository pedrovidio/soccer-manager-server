import { Match, MatchType } from '../domain/entities/Match.js';
import { MatchInvite } from '../domain/entities/MatchInvite.js';
import { Notification } from '../domain/entities/Notification.js';
import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';
import { IMatchInviteRepository } from '../domain/repositories/IMatchInviteRepository.js';
import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { INotificationRepository } from '../domain/repositories/INotificationRepository.js';
import { IWhatsAppService } from '../domain/services/IWhatsAppService.js';
import { EntityNotFoundError } from '../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../domain/errors/BusinessRuleViolationError.js';

export interface CreateMatchInput {
  adminId: string;
  groupId: string;
  type: MatchType;
  date: Date;
  location: string;
  latitude: number;
  longitude: number;
  totalVacancies: number;
  reserveVacancies?: number;
  spotRadiusKm?: number;
  minOverall?: number;
  minAge?: number;
  maxAge?: number;
}

export interface CreateMatchOutput {
  matchId: string;
  invitesSent: number;
}

export class CreateMatchUseCase {
  constructor(
    private matchRepository: IMatchRepository,
    private matchInviteRepository: IMatchInviteRepository,
    private groupRepository: IGroupRepository,
    private athleteRepository: IAthleteRepository,
    private notificationRepository: INotificationRepository,
    private whatsAppService: IWhatsAppService,
  ) {}

  async execute(input: CreateMatchInput): Promise<CreateMatchOutput> {
    const group = await this.groupRepository.findById(input.groupId);
    if (!group) throw new EntityNotFoundError('Group', input.groupId);

    if (!group.isAdmin(input.adminId)) {
      throw new BusinessRuleViolationError('Only administrators can create matches');
    }

    if (input.date <= new Date()) {
      throw new BusinessRuleViolationError('Match date must be in the future');
    }

    const match = new Match(
      input.groupId,
      input.type,
      input.date,
      input.location,
      input.latitude,
      input.longitude,
      input.totalVacancies,
      input.reserveVacancies ?? 0,
      input.spotRadiusKm ?? 10,
      input.minOverall ?? 0,
      input.minAge ?? 16,
      input.maxAge ?? 99,
    );

    await this.matchRepository.save(match);

    const memberIds = [...group.adminIds, ...group.memberIds].filter(
      (id, idx, arr) => arr.indexOf(id) === idx,
    );

    let invitesSent = 0;

    for (const athleteId of memberIds) {
      const athlete = await this.athleteRepository.findById(athleteId);
      if (!athlete) continue;

      const invite = new MatchInvite(match.id, athleteId, 'MEMBER');
      await this.matchInviteRepository.save(invite);

      const typeLabel = { CAMPO: 'Campo', SOCIETY: 'Society', FUTSAL: 'Futsal' }[match.type];
      const dateStr   = match.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      await this.notificationRepository.save(new Notification(
        athleteId,
        'MATCH_INVITE',
        `Convocação: ${group.name}`,
        `Você foi convocado para o jogo de ${typeLabel} em ${match.location} no dia ${dateStr}. Confirme sua presença!`,
        invite.id,
      ));

      await this.whatsAppService.sendMessage(
        athlete.phone,
        `⚽ Olá, ${athlete.name}! Você foi convocado para o jogo de ${typeLabel} do grupo "${group.name}" em ${match.location} no dia ${dateStr}. Abra o app para confirmar sua presença!`,
      );

      invitesSent++;
    }

    return { matchId: match.id, invitesSent };
  }
}
