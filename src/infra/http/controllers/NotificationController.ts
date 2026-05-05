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
      await new PrismaNotificationRepository(prisma).markAsRead(notificationId);
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;
      await prisma.notification.updateMany({ where: { athleteId }, data: { isRead: true } });
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }

  async deleteOne(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = req.params['notificationId'] as string;
      const athleteId = req.params['athleteId'] as string;
      await prisma.notification.deleteMany({ where: { id: notificationId, athleteId } });
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }

  async deleteAll(req: Request, res: Response): Promise<void> {
    try {
      const athleteId = req.params['athleteId'] as string;
      await prisma.notification.deleteMany({ where: { athleteId } });
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
}
