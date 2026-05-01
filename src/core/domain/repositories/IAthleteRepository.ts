import { Athlete } from '../entities/Athlete.js';

export interface FindNearbyFilters {
  latitude: number;
  longitude: number;
  radiusInKm: number;
  minOverall?: number;
  positions?: string[];
  minAge?: number;
  maxAge?: number;
}

export interface AthleteSearchFilters {
  name?: string;
  cpf?: string;
  email?: string;
}

export interface IAthleteRepository {
  findById(id: string): Promise<Athlete | null>;
  findByCpf(cpf: string): Promise<Athlete | null>;
  findByEmail(email: string): Promise<Athlete | null>;
  save(athlete: Athlete): Promise<void>;
  updateLocation(athleteId: string, latitude: number, longitude: number): Promise<void>;
  updateInjuredStatus(athleteId: string, isInjured: boolean): Promise<void>;
  findNearby(filters: FindNearbyFilters): Promise<Athlete[]>;
  search(filters: AthleteSearchFilters): Promise<Athlete[]>;
}