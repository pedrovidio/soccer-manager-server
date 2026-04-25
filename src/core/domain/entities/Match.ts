import { randomUUID } from 'crypto';
import { BusinessRuleViolationError } from '../errors/BusinessRuleViolationError.js';

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum AthleteMatchStatus {
  CONFIRMED_PRESENCE = 'CONFIRMED_PRESENCE',
  CHECKED_IN = 'CHECKED_IN',
}

export class Match {
  public readonly id: string;
  public groupId: string;
  public date: Date;
  public latitude: number;
  public longitude: number;
  public vacanciesOpen: number;
  public minOverall: number;
  public minAge: number;
  public maxAge: number;
  public status: MatchStatus;
  public confirmedPresence: string[] = [];
  public athleteStatuses: Map<string, AthleteMatchStatus> = new Map();

  constructor(
    groupId: string,
    date: Date,
    latitude: number,
    longitude: number,
    vacanciesOpen: number,
    minOverall: number,
    minAge: number,
    maxAge: number,
    status: MatchStatus = MatchStatus.SCHEDULED,
    id?: string
  ) {
    this.validateBusinessRules(minAge, maxAge, vacanciesOpen, minOverall);

    this.id = id ?? randomUUID();
    this.groupId = groupId;
    this.date = date;
    this.latitude = latitude;
    this.longitude = longitude;
    this.vacanciesOpen = vacanciesOpen;
    this.minOverall = minOverall;
    this.minAge = minAge;
    this.maxAge = maxAge;
    this.status = status;
  }

  private validateBusinessRules(minAge: number, maxAge: number, vacanciesOpen: number, minOverall: number): void {
    if (minAge > maxAge) {
      throw new BusinessRuleViolationError('Minimum age cannot be greater than maximum age');
    }
    if (vacanciesOpen < 0) {
      throw new BusinessRuleViolationError('Vacancies open cannot be negative');
    }
    if (minOverall < 0) {
      throw new BusinessRuleViolationError('Minimum overall cannot be negative');
    }
  }

  public canCheckIn(currentTime: Date): boolean {
    const thirtyMinutesBefore = new Date(this.date.getTime() - 30 * 60 * 1000);
    return currentTime >= thirtyMinutesBefore && currentTime <= this.date;
  }

  public finishMatch(): void {
    if (this.status !== MatchStatus.IN_PROGRESS) {
      throw new BusinessRuleViolationError('Match can only be finished if it is in progress');
    }
    this.status = MatchStatus.FINISHED;
  }

  public updateStatus(newStatus: MatchStatus): void {
    this.status = newStatus;
  }

  public decreaseVacancies(): void {
    if (this.vacanciesOpen > 0) {
      this.vacanciesOpen -= 1;
    } else {
      throw new BusinessRuleViolationError('No vacancies available');
    }
  }

  public confirmPresence(athleteId: string): void {
    if (!this.confirmedPresence.includes(athleteId)) {
      this.confirmedPresence.push(athleteId);
      this.athleteStatuses.set(athleteId, AthleteMatchStatus.CONFIRMED_PRESENCE);
    }
  }

  public checkIn(athleteId: string): void {
    if (this.confirmedPresence.includes(athleteId)) {
      this.athleteStatuses.set(athleteId, AthleteMatchStatus.CHECKED_IN);
    } else {
      throw new BusinessRuleViolationError('Athlete is not confirmed for this match');
    }
  }
}