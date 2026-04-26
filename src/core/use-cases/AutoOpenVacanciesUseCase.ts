import { MatchInvite } from '../domain/entities/MatchInvite.js';
import { Notification } from '../domain/entities/Notification.js';
import { IMatchRepository } from '../domain/repositories/IMatchRepository.js';
import { IMatchInviteRepository } from '../domain/repositories/IMatchInviteRepository.js';
import { IGroupRepository } from '../domain/repositories/IGroupRepository.js';
import { IAthleteRepository } from '../domain/repositories/IAthleteRepository.js';
import { INotificationRepository } from '../domain/repositories/INotificationRepository.js';
import { IWhatsAppService } from '../domain/services/IWhatsAppService.js';

export interface AutoOpenVacanciesOutput {
  matchesProcessed: number;
  totalSpotInvitesSent: number;
}

export class AutoOpenVacanciesUseCase {
  constructor(
    private matchRepository: IMatchRepository,
    private matchInviteRepository: IMatchInviteRepository,
    private groupRepository: IGroupRepository,
    private athleteRepository: IAthleteRepository,
    private notificationRepository: INotificationRepository,
    private whatsAppService: IWhatsAppService,
  ) {}

  // Called by cron every minute — processes matches starting in ~30 min with missing check-ins
  async execute(): Promise<AutoOpenVacanciesOutput> {
    const now = new Date();
    const in30min = new Date(now.getTime() + 30 * 60 * 1000);

    // Find SCHEDULED matches whose start time is within the next 30 minutes
    const upcomingMatches = await this.matchRepository.findScheduledBefore(in30min);

    let matchesProcessed = 0;
    let totalSpotInvitesSent = 0;

    for (const match of upcomingMatches) {
      const absentIds = match.getConfirmedWithoutCheckIn();
      if (absentIds.length === 0) continue;

      const group = await this.groupRepository.findById(match.groupId);
      const adminId = group?.adminIds[0];

      // Notify admin about absent athletes
      if (adminId) {
        await this.notificationRepository.save(new Notification(
          adminId,
          'SYSTEM',
          'Atletas sem check-in',
          `${absentIds.length} atleta(s) confirmado(s) não fizeram check-in para o jogo em ${match.location}. Vagas abertas para avulsos.`,
          match.id,
        ));
      }

      // Find nearby spot athletes
      const nearbyAthletes = await this.athleteRepository.findNearby({
        latitude:   match.latitude,
        longitude:  match.longitude,
        radiusInKm: match.spotRadiusKm,
        minOverall: match.minOverall,
        minAge:     match.minAge,
        maxAge:     match.maxAge,
      });

      const existingInvites    = await this.matchInviteRepository.findByMatch(match.id);
      const alreadyInvitedIds  = new Set(existingInvites.map((i) => i.athleteId));
      const groupMemberIds     = new Set([...(group?.adminIds ?? []), ...(group?.memberIds ?? [])]);

      const candidates = nearbyAthletes.filter(
        (a) => !alreadyInvitedIds.has(a.id) && !groupMemberIds.has(a.id),
      );

      const typeLabel = { CAMPO: 'Campo', SOCIETY: 'Society', FUTSAL: 'Futsal' }[match.type];
      const dateStr   = match.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      for (const athlete of candidates.slice(0, absentIds.length)) {
        const invite = new MatchInvite(match.id, athlete.id, 'SPOT');
        await this.matchInviteRepository.save(invite);

        await this.notificationRepository.save(new Notification(
          athlete.id,
          'MATCH_INVITE',
          `Vaga urgente: ${typeLabel} às ${dateStr}`,
          `Surgiu uma vaga de última hora para o jogo de ${typeLabel} em ${match.location} às ${dateStr}. Aceite agora!`,
          invite.id,
        ));

        await this.whatsAppService.sendMessage(
          athlete.phone,
          `⚽ URGENTE! Vaga de última hora para o jogo de ${typeLabel} em ${match.location} às ${dateStr}. Abra o app e aceite agora!`,
        );

        totalSpotInvitesSent++;
      }

      matchesProcessed++;
    }

    return { matchesProcessed, totalSpotInvitesSent };
  }
}
