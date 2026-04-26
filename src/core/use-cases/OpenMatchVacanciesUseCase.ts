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

export interface OpenMatchVacanciesInput {
  adminId: string;
  matchId: string;
}

export interface OpenMatchVacanciesOutput {
  spotInvitesSent: number;
  vacanciesNeeded: number;
}

export class OpenMatchVacanciesUseCase {
  constructor(
    private matchRepository: IMatchRepository,
    private matchInviteRepository: IMatchInviteRepository,
    private groupRepository: IGroupRepository,
    private athleteRepository: IAthleteRepository,
    private notificationRepository: INotificationRepository,
    private whatsAppService: IWhatsAppService,
  ) {}

  async execute(input: OpenMatchVacanciesInput): Promise<OpenMatchVacanciesOutput> {
    const { adminId, matchId } = input;

    const match = await this.matchRepository.findById(matchId);
    if (!match) throw new EntityNotFoundError('Match', matchId);

    const group = await this.groupRepository.findById(match.groupId);
    if (!group) throw new EntityNotFoundError('Group', match.groupId);

    if (!group.isAdmin(adminId)) {
      throw new BusinessRuleViolationError('Only administrators can open vacancies for spot athletes');
    }

    if (!match.needsSpotRecruitment()) {
      throw new BusinessRuleViolationError('Match already has enough confirmed players');
    }

    const vacanciesNeeded = match.totalVacancies - match.confirmedIds.length;

    const nearbyAthletes = await this.athleteRepository.findNearby({
      latitude:   match.latitude,
      longitude:  match.longitude,
      radiusInKm: match.spotRadiusKm,
      minOverall: match.minOverall,
      minAge:     match.minAge,
      maxAge:     match.maxAge,
    });

    // Exclude athletes already invited or confirmed
    const existingInvites = await this.matchInviteRepository.findByMatch(matchId);
    const alreadyInvitedIds = new Set(existingInvites.map((i) => i.athleteId));
    const groupMemberIds    = new Set([...group.adminIds, ...group.memberIds]);

    const candidates = nearbyAthletes.filter(
      (a) => !alreadyInvitedIds.has(a.id) && !groupMemberIds.has(a.id),
    );

    const typeLabel = { CAMPO: 'Campo', SOCIETY: 'Society', FUTSAL: 'Futsal' }[match.type];
    const dateStr   = match.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let spotInvitesSent = 0;

    for (const athlete of candidates) {
      const invite = new MatchInvite(match.id, athlete.id, 'SPOT');
      await this.matchInviteRepository.save(invite);

      await this.notificationRepository.save(new Notification(
        athlete.id,
        'MATCH_INVITE',
        `Vaga disponível: jogo de ${typeLabel}`,
        `Há uma vaga para o jogo de ${typeLabel} em ${match.location} no dia ${dateStr}. Aceite rápido, é por ordem de chegada!`,
        invite.id,
      ));

      await this.whatsAppService.sendMessage(
        athlete.phone,
        `⚽ Olá, ${athlete.name}! Surgiu uma vaga para o jogo de ${typeLabel} em ${match.location} no dia ${dateStr}. Abra o app e aceite rápido — é por ordem de chegada!`,
      );

      spotInvitesSent++;
    }

    return { spotInvitesSent, vacanciesNeeded };
  }
}
