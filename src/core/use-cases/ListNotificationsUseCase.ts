import { INotificationRepository } from '../domain/repositories/INotificationRepository.js';

export interface ListNotificationsInput {
  athleteId: string;
}

export interface NotificationOutput {
  id: string;
  type: string;
  title: string;
  body: string;
  referenceId: string | undefined;
  isRead: boolean;
  createdAt: Date;
}

export interface ListNotificationsOutput {
  notifications: NotificationOutput[];
  unreadCount: number;
}

export class ListNotificationsUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(input: ListNotificationsInput): Promise<ListNotificationsOutput> {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.findByAthlete(input.athleteId),
      this.notificationRepository.countUnread(input.athleteId),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        referenceId: n.referenceId,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
    };
  }
}
