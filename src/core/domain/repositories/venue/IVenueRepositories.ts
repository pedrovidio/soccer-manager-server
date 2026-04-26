import { VenueOwner } from '../../entities/venue/VenueOwner.js';
import { Venue, Court, CourtAvailability, MatchVenueRecord, MatchType } from '../../entities/venue/Venue.js';

export interface IVenueOwnerRepository {
  save(venueOwner: VenueOwner): Promise<void>;
  findById(id: string): Promise<VenueOwner | null>;
  findByEmail(email: string): Promise<VenueOwner | null>;
  findPending(): Promise<VenueOwner[]>;
}

export interface IVenueRepository {
  save(venue: Venue): Promise<void>;
  findById(id: string): Promise<Venue | null>;
  listByOwner(venueOwnerId: string): Promise<Venue[]>;
}

export interface ICourtRepository {
  save(court: Court): Promise<void>;
  findById(id: string): Promise<Court | null>;
  listByVenue(venueId: string): Promise<Court[]>;
  findAvailable(date: Date, type?: MatchType): Promise<(Court & { availability: CourtAvailability; venueName: string; venueAddress: string })[]>;
}

export interface ICourtAvailabilityRepository {
  save(availability: CourtAvailability): Promise<void>;
  findById(id: string): Promise<CourtAvailability | null>;
  findOpenByCourt(courtId: string): Promise<CourtAvailability[]>;
  findOpenWithSpotInvite(): Promise<(CourtAvailability & { court: Court })[]>;
}

export interface IMatchVenueRecordRepository {
  save(record: MatchVenueRecord): Promise<void>;
  listByVenueOwner(venueOwnerId: string): Promise<MatchVenueRecord[]>;
  findByMatch(matchId: string): Promise<MatchVenueRecord | null>;
}
