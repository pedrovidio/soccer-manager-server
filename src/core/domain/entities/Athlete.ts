import { randomUUID } from 'crypto';
import { BusinessRuleViolationError } from '../errors/BusinessRuleViolationError.js';

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement: string | undefined;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Stats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
}

export type FootballLevel = 'PROFESSIONAL' | 'AMATEUR' | 'CASUAL';

const LEVEL_WEIGHT: Record<FootballLevel, number> = {
  PROFESSIONAL: 1.2,
  AMATEUR: 1.0,
  CASUAL: 0.8,
};

const STAT_KEYS: (keyof Stats)[] = ['pace', 'shooting', 'passing', 'dribbling', 'defense', 'physical'];

export class Athlete {
  public readonly id: string;
  public readonly name: string;
  public readonly cpf: string;
  public readonly email: string;
  public readonly phone: string;
  public readonly address: Address;
  public readonly age: number;
  public readonly gender: 'M' | 'F';
  public readonly position: string;
  public footballLevel: FootballLevel;
  public readonly isGoalkeeperForHire: boolean;
  public readonly latitude: number | undefined;
  public readonly longitude: number | undefined;
  public isInjured: boolean;
  public financialDebt: number;
  public hasCompletedAssessment: boolean;
  public photoUrl: string | undefined;
  public passwordHash: string | undefined;
  private stats: Stats;

  constructor(
    name: string,
    cpf: string,
    email: string,
    phone: string,
    address: Address,
    age: number,
    gender: 'M' | 'F',
    position: string,
    stats: Stats,
    footballLevel: FootballLevel,
    id?: string,
    latitude?: number,
    longitude?: number,
    isGoalkeeperForHire: boolean = false,
    isInjured: boolean = false,
    financialDebt: number = 0,
    hasCompletedAssessment: boolean = false,
    photoUrl?: string,
    passwordHash?: string,
  ) {
    this.validateName(name);
    this.validateCpf(cpf);
    this.validateEmail(email);
    this.validatePhone(phone);
    this.validateAge(age);
    this.validateStats(stats);

    this.id = id ?? randomUUID();
    this.name = name;
    this.cpf = cpf;
    this.email = email;
    this.phone = phone;
    this.address = { ...address };
    this.age = age;
    this.gender = gender;
    this.position = position;
    this.stats = { ...stats };
    this.footballLevel = footballLevel;
    this.latitude = latitude;
    this.longitude = longitude;
    this.isGoalkeeperForHire = isGoalkeeperForHire;
    this.isInjured = isInjured;
    this.financialDebt = financialDebt;
    this.hasCompletedAssessment = hasCompletedAssessment;
    this.photoUrl = photoUrl;
    this.passwordHash = passwordHash;
  }

  public updatePhoto(url: string): void {
    this.photoUrl = url;
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new BusinessRuleViolationError('Name cannot be empty');
    }
  }

  private validateCpf(cpf: string): void {
    if (cpf.replace(/\D/g, '').length !== 11) {
      throw new BusinessRuleViolationError('CPF must contain exactly 11 digits');
    }
  }

  private validateEmail(email: string): void {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BusinessRuleViolationError('Email must have a valid format');
    }
  }

  private validatePhone(phone: string): void {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 11) {
      throw new BusinessRuleViolationError('Phone must contain between 10 and 11 digits');
    }
  }

  private validateAge(age: number): void {
    if (age < 16 || age > 99) {
      throw new BusinessRuleViolationError('Age must be between 16 and 99');
    }
  }

  private validateStats(stats: Stats): void {
    for (const key of STAT_KEYS) {
      if (stats[key] < 0 || stats[key] > 100) {
        throw new BusinessRuleViolationError(`${key} must be between 0 and 100`);
      }
    }
  }

  public completeAssessment(footballLevel: FootballLevel, position: string, stats: Stats): void {
    if (this.hasCompletedAssessment) {
      throw new BusinessRuleViolationError('Assessment has already been completed');
    }
    this.validateStats(stats);
    (this as any).footballLevel = footballLevel;
    (this as any).position = position;
    this.stats = { ...stats };
    this.hasCompletedAssessment = true;
  }

  public getStats(): Readonly<Stats> {
    return { ...this.stats };
  }

  public updatePerformance(newStats: Partial<Stats>): void {
    const updated = { ...this.stats, ...newStats };
    this.validateStats(updated);
    this.stats = updated;
  }

  public calculateOverall(): number {
    const isGoalkeeper = this.position.toLowerCase() === 'goalkeeper';
    const weights: Record<keyof Stats, number> = {
      pace:      isGoalkeeper ? 0.5 : 1.0,
      shooting:  isGoalkeeper ? 0.5 : 1.5,
      passing:   1.0,
      dribbling: 1.0,
      defense:   isGoalkeeper ? 2.0 : 0.5,
      physical:  1.0,
    };
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    const weightedSum = STAT_KEYS.reduce((sum, key) => sum + this.stats[key] * weights[key], 0);
    return Math.round(weightedSum / totalWeight);
  }

  public calculateWeightedOverall(): number {
    return Math.round(this.calculateOverall() * LEVEL_WEIGHT[this.footballLevel]);
  }
}
