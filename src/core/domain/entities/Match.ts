import { randomUUID } from 'crypto';
import { BusinessRuleViolationError } from '../errors/BusinessRuleViolationError.js';

export enum MatchStatus {
  SCHEDULED   = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED    = 'FINISHED',
  CANCELLED   = 'CANCELLED',
}

export type MatchType = 'CAMPO' | 'SOCIETY' | 'FUTSAL';

export class Match {
  public readonly id: string;
  public readonly groupId: string;
  public readonly type: MatchType;
  public readonly date: Date;
  public readonly location: string;
  public readonly latitude: number;
  public readonly longitude: number;
  public readonly totalVacancies: number;
  public readonly reserveVacancies: number;
  public readonly spotRadiusKm: number;
  public readonly minOverall: number;
  public readonly minAge: number;
  public readonly maxAge: number;
  public confirmedIds: string[];
  public checkedInIds: string[];
  public isRecurring: boolean;
  public status: MatchStatus;

  constructor(
    groupId: string,
    type: MatchType,
    date: Date,
    location: string,
    latitude: number,
    longitude: number,
    totalVacancies: number,
    reserveVacancies: number = 0,
    spotRadiusKm: number = 10,
    minOverall: number = 0,
    minAge: number = 16,
    maxAge: number = 99,
    confirmedIds: string[] = [],
    checkedInIds: string[] = [],
    status: MatchStatus = MatchStatus.SCHEDULED,
    id?: string,
    isRecurring: boolean = false,
  ) {
    if (minAge > maxAge) throw new BusinessRuleViolationError('Minimum age cannot be greater than maximum age');
    if (totalVacancies < 1) throw new BusinessRuleViolationError('Total vacancies must be at least 1');
    if (reserveVacancies < 0) throw new BusinessRuleViolationError('Reserve vacancies cannot be negative');

    this.id               = id ?? randomUUID();
    this.groupId          = groupId;
    this.type             = type;
    this.date             = date;
    this.location         = location;
    this.latitude         = latitude;
    this.longitude        = longitude;
    this.totalVacancies   = totalVacancies;
    this.reserveVacancies = reserveVacancies;
    this.spotRadiusKm     = spotRadiusKm;
    this.minOverall       = minOverall;
    this.minAge           = minAge;
    this.maxAge           = maxAge;
    this.confirmedIds     = [...confirmedIds];
    this.checkedInIds     = [...checkedInIds];
    this.status           = status;
    this.isRecurring      = isRecurring;
  }

  public canCheckIn(currentTime: Date): boolean {
    const thirtyMinutesBefore = new Date(this.date.getTime() - 30 * 60 * 1000);
    return currentTime >= thirtyMinutesBefore && currentTime <= this.date;
  }

  public canConfirmPresence(currentTime: Date): boolean {
    const thirtyMinutesBefore = new Date(this.date.getTime() - 30 * 60 * 1000);
    return currentTime < thirtyMinutesBefore && this.status === MatchStatus.SCHEDULED;
  }

  public checkIn(athleteId: string): void {
    if (!this.confirmedIds.includes(athleteId)) {
      throw new BusinessRuleViolationError('Athlete is not confirmed for this match');
    }
    if (this.checkedInIds.includes(athleteId)) return;
    this.checkedInIds.push(athleteId);
  }

  public getConfirmedWithoutCheckIn(): string[] {
    return this.confirmedIds.filter((id) => !this.checkedInIds.includes(id));
  }

  public confirmPresence(athleteId: string): void {
    if (this.confirmedIds.includes(athleteId)) return;
    const totalSlots = this.totalVacancies + this.reserveVacancies;
    if (this.confirmedIds.length >= totalSlots) {
      throw new BusinessRuleViolationError('No vacancies available for this match');
    }
    this.confirmedIds.push(athleteId);
  }

  public needsSpotRecruitment(): boolean {
    return this.confirmedIds.length < this.totalVacancies;
  }

  public finishMatch(): void {
    if (this.status !== MatchStatus.IN_PROGRESS) {
      throw new BusinessRuleViolationError('Match can only be finished if it is in progress');
    }
    this.status = MatchStatus.FINISHED;
  }

  public cancel(): void {
    if (this.status === MatchStatus.FINISHED || this.status === MatchStatus.CANCELLED) {
      throw new BusinessRuleViolationError('Match cannot be cancelled in its current status');
    }
    this.status = MatchStatus.CANCELLED;
  }
}
