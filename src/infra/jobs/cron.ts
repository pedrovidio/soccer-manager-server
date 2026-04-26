import cron from 'node-cron';
import { AutoOpenVacanciesUseCase } from '../../core/use-cases/AutoOpenVacanciesUseCase.js';
import { ConsumeAdminDelegationMatchUseCase } from '../../core/use-cases/ConsumeAdminDelegationMatchUseCase.js';
import { PrismaMatchRepository } from '../database/prisma/repositories/PrismaMatchRepository.js';
import { PrismaMatchInviteRepository } from '../database/prisma/repositories/PrismaMatchInviteRepository.js';
import { PrismaGroupRepository } from '../database/prisma/repositories/PrismaGroupRepository.js';
import { PrismaAthleteRepository } from '../database/prisma/repositories/PrismaAthleteRepository.js';
import { PrismaNotificationRepository } from '../database/prisma/repositories/PrismaNotificationRepository.js';
import { PrismaGroupAdminDelegationRepository } from '../database/prisma/repositories/PrismaGroupAdminDelegationRepository.js';
import { WhatsAppService } from '../services/WhatsAppService.js';
import { prisma } from '../database/prisma/client.js';

export function startCronJobs(): void {
  const useCase = new AutoOpenVacanciesUseCase(
    new PrismaMatchRepository(prisma),
    new PrismaMatchInviteRepository(prisma),
    new PrismaGroupRepository(prisma),
    new PrismaAthleteRepository(),
    new PrismaNotificationRepository(prisma),
    new WhatsAppService(),
  );

  // Runs every minute — checks for matches starting in ~30 min with missing check-ins
  cron.schedule('* * * * *', async () => {
    try {
      const result = await useCase.execute();
      if (result.matchesProcessed > 0) {
        console.log(`[Cron] AutoOpenVacancies: ${result.matchesProcessed} match(es), ${result.totalSpotInvitesSent} spot invite(s) sent`);
      }
    } catch (err) {
      console.error('[Cron] AutoOpenVacancies error:', err);
    }
  });

  // Runs every hour — consumes match count on temporary admin delegations for finished matches
  cron.schedule('0 * * * *', async () => {
    try {
      const consumeUseCase = new ConsumeAdminDelegationMatchUseCase(
        new PrismaGroupRepository(prisma),
        new PrismaGroupAdminDelegationRepository(prisma),
      );
      const recentlyFinished = await prisma.match.findMany({
        where: {
          status: 'FINISHED',
          date: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
        select: { groupId: true },
        distinct: ['groupId'],
      });
      for (const { groupId } of recentlyFinished) {
        await consumeUseCase.execute({ groupId });
      }
    } catch (err) {
      console.error('[Cron] ConsumeAdminDelegation error:', err);
    }
  });

  console.log('[Cron] Jobs started');
}
