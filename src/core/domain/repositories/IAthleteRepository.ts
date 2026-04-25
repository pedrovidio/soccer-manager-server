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

export interface IAthleteRepository {
  findById(id: string): Promise<Athlete | null>;
  findByCpf(cpf: string): Promise<Athlete | null>;
  findByEmail(email: string): Promise<Athlete | null>;
  save(athlete: Athlete): Promise<void>;
  findNearby(filters: FindNearbyFilters): Promise<Athlete[]>;
}