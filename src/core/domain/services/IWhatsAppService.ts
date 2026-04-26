export interface IWhatsAppService {
  sendMessage(phone: string, message: string): Promise<void>;
}
