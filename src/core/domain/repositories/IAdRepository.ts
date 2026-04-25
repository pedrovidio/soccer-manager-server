import { Ad } from '../entities/Ad.js';

export interface IAdRepository {
  save(ad: Ad): Promise<void>;
  findById(id: string): Promise<Ad | null>;
  findActive(): Promise<Ad[]>;
  findActiveByLocation(latitude: number, longitude: number): Promise<Ad[]>;
}