import { IAdRepository } from '../domain/repositories/IAdRepository.js';
import { Ad, AdCategory } from '../domain/entities/Ad.js';

export interface GetRelevantAdsInput {
  userLatitude: number;
  userLongitude: number;
  category?: AdCategory;
}

export interface AdData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  distance: number;
}

export interface GetRelevantAdsOutput {
  ads: AdData[];
}

export class GetRelevantAdsUseCase {
  constructor(private adRepository: IAdRepository) {}

  async execute(input: GetRelevantAdsInput): Promise<GetRelevantAdsOutput> {
    const { userLatitude, userLongitude, category } = input;

    const activeAds = await this.adRepository.findActiveByLocation(userLatitude, userLongitude);

    let relevantAds = activeAds.filter(ad => ad.isRelevantFor(userLatitude, userLongitude));

    // Filtrar por categoria se fornecida
    if (category) {
      relevantAds = relevantAds.filter(ad => ad.category === category);
    }

    // Calcular distâncias e ordenar por proximidade
    const adsWithDistance = relevantAds.map(ad => {
      const distance = this.calculateDistance(ad.latitude, ad.longitude, userLatitude, userLongitude);
      return { ad, distance };
    }).sort((a, b) => a.distance - b.distance);

    const ads: AdData[] = adsWithDistance.map(({ ad, distance }) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      targetUrl: ad.targetUrl,
      distance,
    }));

    return { ads };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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