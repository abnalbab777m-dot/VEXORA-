export class TelegramService {
  get botToken() {
    return process.env.TELEGRAM_BOT_TOKEN;
  }
  get chatId() {
    return process.env.TELEGRAM_CHAT_ID;
  }

  async sendMessage(text: string) {
    if (!this.botToken || !this.chatId) {
      console.warn('Telegram BOT_TOKEN or CHAT_ID is not configured.');
      throw new Error('Telegram is not configured. Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID.');
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
         console.error('Telegram API Response Error:', data);
         throw new Error(`Telegram Error: ${data.description || 'Unknown API Error'}`);
      }
      
      console.log('Telegram message sent successfully:', data.result?.message_id);
      return data;
    } catch (error: any) {
      console.error('Telegram Service Error:', error.message);
      throw error;
    }
  }
}

export const telegramService = new TelegramService();
