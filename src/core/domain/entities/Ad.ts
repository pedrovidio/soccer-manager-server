import { randomUUID } from 'crypto';
import { BusinessRuleViolationError } from '../errors/BusinessRuleViolationError.js';

export enum AdCategory {
  FOOD = 'FOOD',
  HEALTH = 'HEALTH',
  RETAIL = 'RETAIL',
  SPORTS = 'SPORTS',
}

export enum AdStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
}

export class Ad {
  public readonly id: string;
  public title: string;
  public description: string;
  public imageUrl: string;
  public targetUrl: string;
  public latitude: number;
  public longitude: number;
  public radiusInKm: number;
  public category: AdCategory;
  public status: AdStatus;

  constructor(
    title: string,
    description: string,
    imageUrl: string,
    targetUrl: string,
    latitude: number,
    longitude: number,
    radiusInKm: number,
    category: AdCategory,
    status: AdStatus = AdStatus.ACTIVE,
    id?: string,
  ) {
    this.id = id ?? randomUUID();
    this.title = title;
    this.description = description;
    this.imageUrl = imageUrl;
    this.targetUrl = targetUrl;
    this.latitude = latitude;
    this.longitude = longitude;
    this.radiusInKm = radiusInKm;
    this.category = category;
    this.status = status;

    // Validações
    if (!title || title.trim() === '') throw new BusinessRuleViolationError('Title cannot be empty');
    if (!imageUrl || imageUrl.trim() === '') throw new BusinessRuleViolationError('Image URL cannot be empty');
    if (radiusInKm <= 0) throw new BusinessRuleViolationError('Radius must be positive');
    if (latitude < -90 || latitude > 90) throw new BusinessRuleViolationError('Invalid latitude');
    if (longitude < -180 || longitude > 180) throw new BusinessRuleViolationError('Invalid longitude');
  }

  public isRelevantFor(userLat: number, userLng: number): boolean {
    const distance = this.calculateHaversineDistance(this.latitude, this.longitude, userLat, userLng);
    return distance <= this.radiusInKm;
  }

  private calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}