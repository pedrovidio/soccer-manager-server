import { IWhatsAppService } from '../../core/domain/services/IWhatsAppService.js';

export class WhatsAppService implements IWhatsAppService {
  async sendMessage(phone: string, message: string): Promise<void> {
    // TODO: integrate with WhatsApp Business API (e.g. Twilio, Z-API, Evolution API)
    console.log(`[WhatsApp] To: ${phone} | Message: ${message}`);
  }
}
