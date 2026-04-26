import { Notification } from '../entities/Notification.js';

export interface INotificationRepository {
  save(notification: Notification): Promise<void>;
  findByAthlete(athleteId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  countUnread(athleteId: string): Promise<number>;
}
