import { Ad } from '../../../../core/domain/entities/Ad.js';
import { IAdRepository } from '../../../../core/domain/repositories/IAdRepository.js';
import { PrismaAdMapper } from '../mappers/PrismaAdMapper.js';
import { prisma } from '../client.js';

export class PrismaAdRepository implements IAdRepository {
  async save(ad: Ad): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO ads (
        id,
        title,
        description,
        image_url,
        target_url,
        latitude,
        longitude,
        radius_in_km,
        category,
        status,
        active
      ) VALUES (
        ${ad.id},
        ${ad.title},
        ${ad.description},
        ${ad.imageUrl},
        ${ad.targetUrl},
        ${ad.latitude},
        ${ad.longitude},
        ${ad.radiusInKm},
        ${ad.category},
        ${ad.status},
        ${ad.status === 'ACTIVE'}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        target_url = EXCLUDED.target_url,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        radius_in_km = EXCLUDED.radius_in_km,
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        active = EXCLUDED.active;
    `;
  }

  async findById(id: string): Promise<Ad | null> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        title,
        description,
        image_url AS "imageUrl",
        target_url AS "targetUrl",
        latitude,
        longitude,
        radius_in_km AS "radiusInKm",
        category,
        status,
        active
      FROM ads
      WHERE id = ${id}
      LIMIT 1
    `;

    return results.length > 0 ? PrismaAdMapper.toDomain(results[0]) : null;
  }

  async findActive(): Promise<Ad[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        title,
        description,
        image_url AS "imageUrl",
        target_url AS "targetUrl",
        latitude,
        longitude,
        radius_in_km AS "radiusInKm",
        category,
        status,
        active
      FROM ads
      WHERE status = 'ACTIVE'
    `;

    return results.map(PrismaAdMapper.toDomain);
  }

  async findActiveByLocation(latitude: number, longitude: number): Promise<Ad[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        title,
        description,
        image_url AS "imageUrl",
        target_url AS "targetUrl",
        latitude,
        longitude,
        radius_in_km AS "radiusInKm",
        category,
        status
      FROM ads
      WHERE status = 'ACTIVE'
        AND 6371 * 2 * ASIN(SQRT(
          POWER(SIN(RADIANS((${latitude} - latitude) / 2)), 2) +
          COS(RADIANS(${latitude})) * COS(RADIANS(latitude)) *
          POWER(SIN(RADIANS((${longitude} - longitude) / 2)), 2)
        )) <= radius_in_km
    `;

    return results.map(PrismaAdMapper.toDomain);
  }
}
