import { PrismaClient } from '@prisma/client';
import { IAthleteSocialAccountRepository } from '../../../../core/domain/repositories/IAthleteSocialAccountRepository.js';

export class PrismaAthleteSocialAccountRepository implements IAthleteSocialAccountRepository {
  constructor(private prisma: PrismaClient) {}

  async findByProvider(provider: string, providerId: string): Promise<{ athleteId: string } | null> {
    const raw = await this.prisma.athleteSocialAccount.findUnique({
      where: { provider_providerId: { provider, providerId } },
      select: { athleteId: true },
    });
    return raw ?? null;
  }

  async save(athleteId: string, provider: string, providerId: string): Promise<void> {
    await this.prisma.athleteSocialAccount.upsert({
      where: { provider_providerId: { provider, providerId } },
      update: {},
      create: { athleteId, provider, providerId },
    });
  }
}
