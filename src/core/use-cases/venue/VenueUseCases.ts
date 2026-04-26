import { Venue, Court, CourtAvailability, MatchType } from '../../domain/entities/venue/Venue.js';
import { IVenueOwnerRepository, IVenueRepository, ICourtRepository, ICourtAvailabilityRepository } from '../../domain/repositories/venue/IVenueRepositories.js';
import { IAthleteRepository } from '../../domain/repositories/IAthleteRepository.js';
import { IMatchInviteRepository } from '../../domain/repositories/IMatchInviteRepository.js';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository.js';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository.js';
import { IMatchRepository } from '../../domain/repositories/IMatchRepository.js';
import { IMatchVenueRecordRepository } from '../../domain/repositories/venue/IVenueRepositories.js';
import { ISuperAdminRepository } from '../../domain/repositories/venue/ISuperAdminRepository.js';
import { EntityNotFoundError } from '../../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../../domain/errors/BusinessRuleViolationError.js';
import { Notification } from '../../domain/entities/Notification.js';
import { MatchInvite } from '../../domain/entities/MatchInvite.js';
import { Group } from '../../domain/entities/Group.js';
import { Match, MatchStatus } from '../../domain/entities/Match.js';
import { MatchVenueRecord } from '../../domain/entities/venue/Venue.js';

// ── Create Venue ──
export class CreateVenueUseCase {
  constructor(private venueOwnerRepo: IVenueOwnerRepository, private venueRepo: IVenueRepository) {}

  async execute(input: { venueOwnerId: string; name: string; address: string; latitude: number; longitude: number }): Promise<Venue> {
    const owner = await this.venueOwnerRepo.findById(input.venueOwnerId);
    if (!owner) throw new EntityNotFoundError('VenueOwner', input.venueOwnerId);
    if (!owner.isApproved()) throw new BusinessRuleViolationError('VenueOwner is not approved');
    const venue = new Venue(input.venueOwnerId, input.name, input.address, input.latitude, input.longitude);
    await this.venueRepo.save(venue);
    return venue;
  }
}

// ── Create Court ──
export class CreateCourtUseCase {
  constructor(private venueOwnerRepo: IVenueOwnerRepository, private venueRepo: IVenueRepository, private courtRepo: ICourtRepository) {}

  async execute(input: { venueOwnerId: string; venueId: string; name: string; type: MatchType; isCovered: boolean; rentalPrice: number }): Promise<Court> {
    const venue = await this.venueRepo.findById(input.venueId);
    if (!venue) throw new EntityNotFoundError('Venue', input.venueId);
    if (venue.venueOwnerId !== input.venueOwnerId) throw new BusinessRuleViolationError('Venue does not belong to this owner');
    const court = new Court(input.venueId, input.name, input.type, input.isCovered, input.rentalPrice);
    await this.courtRepo.save(court);
    return court;
  }
}

// ── Add Court Availability ──
export class AddCourtAvailabilityUseCase {
  constructor(
    private venueOwnerRepo: IVenueOwnerRepository,
    private venueRepo: IVenueRepository,
    private courtRepo: ICourtRepository,
    private availabilityRepo: ICourtAvailabilityRepository,
    private athleteRepo: IAthleteRepository,
    private matchInviteRepo: IMatchInviteRepository,
    private notificationRepo: INotificationRepository,
    private groupRepo: IGroupRepository,
    private matchRepo: IMatchRepository,
    private matchVenueRecordRepo: IMatchVenueRecordRepository,
    private superAdminRepo: ISuperAdminRepository,
  ) {}

  async execute(input: {
    venueOwnerId: string;
    courtId: string;
    date: Date;
    startTime: string;
    endTime: string;
    inviteSpotAthletes: boolean;
    totalVacancies: number;
    spotRadiusKm?: number;
    minOverall?: number;
    minAge?: number;
    maxAge?: number;
  }): Promise<CourtAvailability> {
    const owner = await this.venueOwnerRepo.findById(input.venueOwnerId);
    if (!owner) throw new EntityNotFoundError('VenueOwner', input.venueOwnerId);
    if (!owner.isApproved()) throw new BusinessRuleViolationError('VenueOwner is not approved');
    if (!owner.asaasWalletId) throw new BusinessRuleViolationError('VenueOwner must configure Asaas wallet before opening availabilities');

    const court = await this.courtRepo.findById(input.courtId);
    if (!court) throw new EntityNotFoundError('Court', input.courtId);

    const venue = await this.venueRepo.findById(court.venueId);
    if (!venue || venue.venueOwnerId !== input.venueOwnerId) throw new BusinessRuleViolationError('Court does not belong to this owner');

    const availability = new CourtAvailability(input.courtId, input.date, input.startTime, input.endTime, input.inviteSpotAthletes);
    await this.availabilityRepo.save(availability);

    if (input.inviteSpotAthletes) {
      await this._createGroupAndInviteAthletes(availability, court, venue, owner, input);
    }

    return availability;
  }

  private async _createGroupAndInviteAthletes(
    availability: CourtAvailability,
    court: Court,
    venue: any,
    owner: any,
    input: any,
  ): Promise<void> {
    const superAdmin = await this.superAdminRepo.find();
    const commissionRate = superAdmin?.commissionRate ?? 0.1;

    // Create temporary group owned by venue owner
    const group = new Group(
      `${venue.name} — ${input.date.toLocaleDateString('pt-BR')} ${input.startTime}`,
      [owner.id],
      [],
      undefined,
      { latitude: venue.latitude, longitude: venue.longitude },
      undefined,
      undefined,
      `Jogo organizado pela quadra ${venue.name}`,
    );
    await this.groupRepo.save(group);

    // Create match linked to the group
    const match = new Match(
      group.id,
      court.type,
      new Date(`${input.date.toISOString().split('T')[0]}T${input.startTime}:00`),
      venue.address,
      venue.latitude,
      venue.longitude,
      input.totalVacancies,
      0,
      input.spotRadiusKm ?? 10,
      input.minOverall ?? 0,
      input.minAge ?? 16,
      input.maxAge ?? 99,
    );
    await this.matchRepo.save(match);

    // Record venue history
    const record = new MatchVenueRecord(match.id, court.id, owner.id, 'VENUE_OWNER', owner.id, court.rentalPrice, commissionRate);
    await this.matchVenueRecordRepo.save(record);

    // Book the availability
    availability.book();
    await this.availabilityRepo.save(availability);

    // Find and invite nearby athletes
    const nearby = await this.athleteRepo.findNearby({
      latitude: venue.latitude,
      longitude: venue.longitude,
      radiusInKm: input.spotRadiusKm ?? 10,
      minOverall: input.minOverall,
      minAge: input.minAge,
      maxAge: input.maxAge,
    });

    const dateStr = input.date.toLocaleDateString('pt-BR');
    for (const athlete of nearby) {
      const invite = new MatchInvite(match.id, athlete.id, 'SPOT');
      await this.matchInviteRepo.save(invite);
      await this.notificationRepo.save(new Notification(
        athlete.id,
        'MATCH_INVITE',
        `Vaga disponível — ${venue.name}`,
        `A quadra ${venue.name} tem uma vaga para ${court.type} em ${dateStr} às ${input.startTime}. Valor: R$ ${(court.rentalPrice / input.totalVacancies).toFixed(2)} por atleta.`,
        invite.id,
      ));
    }
  }
}

// ── List available courts (for group admins creating a match) ──
export class ListAvailableCourtsUseCase {
  constructor(private courtRepo: ICourtRepository) {}

  async execute(date: Date, type?: MatchType) {
    return this.courtRepo.findAvailable(date, type);
  }
}

// ── List match history by venue owner ──
export class ListVenueMatchHistoryUseCase {
  constructor(private matchVenueRecordRepo: IMatchVenueRecordRepository) {}

  async execute(venueOwnerId: string): Promise<MatchVenueRecord[]> {
    return this.matchVenueRecordRepo.listByVenueOwner(venueOwnerId);
  }
}
