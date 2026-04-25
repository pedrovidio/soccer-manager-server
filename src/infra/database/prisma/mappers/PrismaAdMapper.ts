import { Ad, AdCategory, AdStatus } from '../../../../core/domain/entities/Ad.js';

export class PrismaAdMapper {
  static toDomain(raw: any): Ad {
    const status = raw.status ?? (raw.active ? AdStatus.ACTIVE : AdStatus.EXPIRED);

    return new Ad(
      raw.title,
      raw.description,
      raw.imageUrl,
      raw.targetUrl,
      raw.latitude,
      raw.longitude,
      raw.radiusInKm,
      raw.category as AdCategory,
      status as AdStatus,
      raw.id,
    );
  }

  static toPersistence(ad: Ad): any {
    return {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      image_url: ad.imageUrl,
      target_url: ad.targetUrl,
      latitude: ad.latitude,
      longitude: ad.longitude,
      radius_in_km: ad.radiusInKm,
      category: ad.category,
      status: ad.status,
    };
  }
}
