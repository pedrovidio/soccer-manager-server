import { randomUUID } from 'crypto';
import { BusinessRuleViolationError } from '../../errors/BusinessRuleViolationError.js';

export type MatchType = 'CAMPO' | 'SOCIETY' | 'FUTSAL';
export type CourtAvailabilityStatus = 'OPEN' | 'BOOKED' | 'CANCELLED';

export class Venue {
  public readonly id: string;
  public readonly venueOwnerId: string;
  public name: string;
  public address: string;
  public latitude: number;
  public longitude: number;
  public photoUrl: string | undefined;

  constructor(
    venueOwnerId: string,
    name: string,
    address: string,
    latitude: number,
    longitude: number,
    id?: string,
    photoUrl?: string,
  ) {
    this.id = id ?? randomUUID();
    this.venueOwnerId = venueOwnerId;
    this.name = name;
    this.address = address;
    this.latitude = latitude;
    this.longitude = longitude;
    this.photoUrl = photoUrl;
  }
}

export class Court {
  public readonly id: string;
  public readonly venueId: string;
  public name: string;
  public type: MatchType;
  public isCovered: boolean;
  public rentalPrice: number;

  constructor(
    venueId: string,
    name: string,
    type: MatchType,
    isCovered: boolean,
    rentalPrice: number,
    id?: string,
  ) {
    if (rentalPrice < 0) throw new BusinessRuleViolationError('Rental price cannot be negative');
    this.id = id ?? randomUUID();
    this.venueId = venueId;
    this.name = name;
    this.type = type;
    this.isCovered = isCovered;
    this.rentalPrice = rentalPrice;
  }
}

export class CourtAvailability {
  public readonly id: string;
  public readonly courtId: string;
  public readonly date: Date;
  public readonly startTime: string;
  public readonly endTime: string;
  public status: CourtAvailabilityStatus;
  public readonly inviteSpotAthletes: boolean;
  public readonly createdAt: Date;

  constructor(
    courtId: string,
    date: Date,
    startTime: string,
    endTime: string,
    inviteSpotAthletes: boolean = false,
    id?: string,
    status: CourtAvailabilityStatus = 'OPEN',
    createdAt?: Date,
  ) {
    this.id = id ?? randomUUID();
    this.courtId = courtId;
    this.date = date;
    this.startTime = startTime;
    this.endTime = endTime;
    this.inviteSpotAthletes = inviteSpotAthletes;
    this.status = status;
    this.createdAt = createdAt ?? new Date();
  }

  public book(): void {
    if (this.status !== 'OPEN') throw new BusinessRuleViolationError('Court availability is not open');
    this.status = 'BOOKED';
  }

  public cancel(): void {
    if (this.status === 'CANCELLED') throw new BusinessRuleViolationError('Court availability is already cancelled');
    this.status = 'CANCELLED';
  }
}

export class MatchVenueRecord {
  public readonly id: string;
  public readonly matchId: string;
  public readonly courtId: string;
  public readonly venueOwnerId: string;
  public readonly createdByType: 'VENUE_OWNER' | 'GROUP_ADMIN';
  public readonly createdById: string;
  public readonly rentalPrice: number;
  public readonly commissionRate: number;
  public readonly commissionAmount: number;
  public readonly createdAt: Date;

  constructor(
    matchId: string,
    courtId: string,
    venueOwnerId: string,
    createdByType: 'VENUE_OWNER' | 'GROUP_ADMIN',
    createdById: string,
    rentalPrice: number,
    commissionRate: number,
    id?: string,
    createdAt?: Date,
  ) {
    this.id = id ?? randomUUID();
    this.matchId = matchId;
    this.courtId = courtId;
    this.venueOwnerId = venueOwnerId;
    this.createdByType = createdByType;
    this.createdById = createdById;
    this.rentalPrice = rentalPrice;
    this.commissionRate = commissionRate;
    this.commissionAmount = Math.round(rentalPrice * commissionRate * 100) / 100;
    this.createdAt = createdAt ?? new Date();
  }
}
