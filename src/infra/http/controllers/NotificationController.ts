import { Request, Response } from 'express';
import { ListNotificationsUseCase } from '../../../core/use-cases/ListNotificationsUseCase.js';
import { PrismaNotificationRepository } from '../../database/prisma/repositories/PrismaNotificationRepository.js';
import { prisma } from '../../database/prisma/client.js';

export class NotificationController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;
      const useCase = new ListNotificationsUseCase(new PrismaNotificationRepository(prisma));
      const result = await useCase.execute({ athleteId });
      res.status(200).json(result);
    } catch {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = req.params['notificationId'] as string;
      const repo = new PrismaNotificationRepository(prisma);
      await repo.markAsRead(notificationId);
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
}
