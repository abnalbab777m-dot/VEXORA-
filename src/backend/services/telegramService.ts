import axios from 'axios';
import { db } from '../../db';
import { appSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class TelegramService {
  async getSettings() {
    let botToken = process.env.TELEGRAM_BOT_TOKEN;
    let chatId = process.env.TELEGRAM_CHAT_ID;

    try {
      const dbToken = await db.query.appSettings.findFirst({ where: eq(appSettings.key, 'telegram_bot_token') });
      const dbChat = await db.query.appSettings.findFirst({ where: eq(appSettings.key, 'telegram_chat_id') });
      if (dbToken?.value) botToken = dbToken.value;
      if (dbChat?.value) chatId = dbChat.value;
    } catch (err) {
      console.error('Error fetching telegram settings from DB', err);
    }
    return { botToken, chatId };
  }

  async saveSettings(botToken: string, chatId: string) {
    await db.insert(appSettings).values({ key: 'telegram_bot_token', value: botToken })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: botToken, updatedAt: new Date() } });
    await db.insert(appSettings).values({ key: 'telegram_chat_id', value: chatId })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: chatId, updatedAt: new Date() } });
  }

  async sendMessage(text: string) {
    const { botToken, chatId } = await this.getSettings();
    if (!botToken || !chatId) {
      console.warn('Telegram BOT_TOKEN or CHAT_ID is not configured.');
      throw new Error('Telegram is not configured. Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID.');
    }

    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await axios.post(url, {
        chat_id: chatId,
        text: text,
      });

      console.log('Telegram message sent successfully:', response.data.result?.message_id);
      return response.data;
    } catch (error: any) {
      if (error.response) {
         console.error('Telegram API Response Error:', error.response.data);
         throw new Error(`Telegram Error: ${error.response.data.description || 'Unknown API Error'}`);
      } else {
         console.error('Telegram Service Error:', error.message);
         throw error;
      }
    }
  }
}

export const telegramService = new TelegramService();
