import axios from 'axios';
import { db, hasDatabase } from '../../db';
import { appSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  can_join_groups?: boolean;
}

export interface TelegramSettings {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifyUsers: boolean;
  notifyDeposits: boolean;
  notifyWithdrawals: boolean;
  notifyDisputes: boolean;
  botInfo?: TelegramBotInfo | null;
}

export class TelegramService {
  private cache: { settings: TelegramSettings; expiresAt: number } | null = null;

  // Clean token from common copy-paste errors (e.g., "bot123456:ABC", "https://api.telegram.org/bot...", extra spaces, RTL flipped text)
  cleanToken(token?: string): string {
    if (!token) return '';
    let cleaned = token.trim();
    
    // Check if user pasted full API URL
    const urlMatch = cleaned.match(/\/bot([0-9]+:[a-zA-Z0-9_-]+)/);
    if (urlMatch) {
      cleaned = urlMatch[1];
    } else if (cleaned.toLowerCase().startsWith('bot') && cleaned.includes(':')) {
      // User wrote "bot123456:ABC..."
      cleaned = cleaned.substring(3).trim();
    }

    // Remove all whitespace
    cleaned = cleaned.replace(/\s*:\s*/g, ':').replace(/\s+/g, '');

    // Handle RTL reverse swap where digits are placed after alphanumeric secret (e.g. "secret:1234567890" instead of "1234567890:secret")
    const reversedRtlMatch = cleaned.match(/^([a-zA-Z0-9_-]{20,}):([0-9]{7,12})$/);
    if (reversedRtlMatch) {
      cleaned = `${reversedRtlMatch[2]}:${reversedRtlMatch[1]}`;
    }

    return cleaned;
  }

  // Clean chat ID (trim whitespace, preserve '-' for groups/channels and '@' for public channels)
  cleanChatId(chatId?: string): string {
    if (!chatId) return '';
    return chatId.trim().replace(/\s+/g, '');
  }

  // Get current settings with fallback from DB to process.env
  async getSettings(forceRefresh = false): Promise<TelegramSettings> {
    if (!forceRefresh && this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.settings;
    }

    let botToken = this.cleanToken(process.env.TELEGRAM_BOT_TOKEN);
    let chatId = this.cleanChatId(process.env.TELEGRAM_CHAT_ID);
    let enabled = true;
    let notifyUsers = true;
    let notifyDeposits = true;
    let notifyWithdrawals = true;
    let notifyDisputes = true;

    if (hasDatabase()) {
      try {
        const rows = await db.select().from(appSettings);
        const settingsMap = new Map(rows.map(r => [r.key, r.value]));

        if (settingsMap.has('telegram_bot_token')) {
          botToken = this.cleanToken(settingsMap.get('telegram_bot_token') || '');
        }
        if (settingsMap.has('telegram_chat_id')) {
          chatId = this.cleanChatId(settingsMap.get('telegram_chat_id') || '');
        }
        if (settingsMap.has('telegram_enabled')) {
          enabled = settingsMap.get('telegram_enabled') !== 'false';
        }
        if (settingsMap.has('telegram_notify_users')) {
          notifyUsers = settingsMap.get('telegram_notify_users') !== 'false';
        }
        if (settingsMap.has('telegram_notify_deposits')) {
          notifyDeposits = settingsMap.get('telegram_notify_deposits') !== 'false';
        }
        if (settingsMap.has('telegram_notify_withdrawals')) {
          notifyWithdrawals = settingsMap.get('telegram_notify_withdrawals') !== 'false';
        }
        if (settingsMap.has('telegram_notify_disputes')) {
          notifyDisputes = settingsMap.get('telegram_notify_disputes') !== 'false';
        }
      } catch (err) {
        console.error('[TelegramService] Error loading settings from database:', err);
      }
    }

    let botInfo: TelegramBotInfo | null = null;
    if (botToken) {
      const verifyRes = await this.verifyBot(botToken);
      if (verifyRes.success && verifyRes.bot) {
        botInfo = verifyRes.bot;
      }
    }

    const settings: TelegramSettings = {
      botToken,
      chatId,
      enabled,
      notifyUsers,
      notifyDeposits,
      notifyWithdrawals,
      notifyDisputes,
      botInfo
    };

    this.cache = {
      settings,
      expiresAt: Date.now() + 10000 // 10 seconds cache
    };

    return settings;
  }

  // Save settings into app_settings table
  async saveSettings(settings: {
    botToken?: string;
    chatId?: string;
    enabled?: boolean;
    notifyUsers?: boolean;
    notifyDeposits?: boolean;
    notifyWithdrawals?: boolean;
    notifyDisputes?: boolean;
  }) {
    if (!hasDatabase()) {
      throw new Error('Database is not configured.');
    }

    const token = this.cleanToken(settings.botToken);
    const chat = this.cleanChatId(settings.chatId);

    const upsertSetting = async (key: string, value: string) => {
      try {
        await db.insert(appSettings).values({ key, value })
          .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
      } catch (err) {
        // Safe manual fallback if constraint name differs or on conflict syntax fails
        try {
          const existing = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
          if (existing && existing.length > 0) {
            await db.update(appSettings).set({ value, updatedAt: new Date() }).where(eq(appSettings.key, key));
          } else {
            await db.insert(appSettings).values({ key, value });
          }
        } catch (innerErr) {
          console.error(`[TelegramService] Fallback upsert failed for key ${key}:`, innerErr);
          throw innerErr;
        }
      }
    };

    if (settings.botToken !== undefined) await upsertSetting('telegram_bot_token', token);
    if (settings.chatId !== undefined) await upsertSetting('telegram_chat_id', chat);
    if (settings.enabled !== undefined) await upsertSetting('telegram_enabled', settings.enabled ? 'true' : 'false');
    if (settings.notifyUsers !== undefined) await upsertSetting('telegram_notify_users', settings.notifyUsers ? 'true' : 'false');
    if (settings.notifyDeposits !== undefined) await upsertSetting('telegram_notify_deposits', settings.notifyDeposits ? 'true' : 'false');
    if (settings.notifyWithdrawals !== undefined) await upsertSetting('telegram_notify_withdrawals', settings.notifyWithdrawals ? 'true' : 'false');
    if (settings.notifyDisputes !== undefined) await upsertSetting('telegram_notify_disputes', settings.notifyDisputes ? 'true' : 'false');

    this.cache = null; // Invalidate cache

    return await this.getSettings(true);
  }

  // Verify if a bot token is valid via Telegram getMe
  async verifyBot(botToken?: string): Promise<{ success: boolean; bot?: TelegramBotInfo; error?: string }> {
    const token = this.cleanToken(botToken);
    if (!token) {
      return { success: false, error: 'رمز البوت (Bot Token) فارغ.' };
    }

    try {
      const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`, { timeout: 8000 });
      if (response.data && response.data.ok) {
        return { success: true, bot: response.data.result };
      }
      return { success: false, error: response.data.description || 'فشل التحقق من البوت.' };
    } catch (error: any) {
      const desc = error.response?.data?.description || error.message;
      if (error.response?.status === 401 || desc.includes('Unauthorized')) {
        return { success: false, error: 'رمز البوت (Token) غير صالح أو منتهي الصلاحية. تأكد من نسخه من @BotFather.' };
      }
      return { success: false, error: `خطأ في الاتصال بتليغرام: ${desc}` };
    }
  }

  // Test the connection with specified or saved credentials
  async testConnection(testToken?: string, testChatId?: string): Promise<{ success: boolean; botInfo?: TelegramBotInfo; message?: string; error?: string }> {
    const settings = await this.getSettings();
    const token = this.cleanToken(testToken || settings.botToken);
    const chatId = this.cleanChatId(testChatId || settings.chatId);

    if (!token) {
      return {
        success: false,
        error: 'يرجى إدخال رمز البوت (Bot Token) أولاً.'
      };
    }

    if (!chatId) {
      return {
        success: false,
        error: 'يرجى إدخال معرف المحادثة (Chat ID) أولاً.'
      };
    }

    // 1. Verify Bot Token
    const botRes = await this.verifyBot(token);
    if (!botRes.success || !botRes.bot) {
      return {
        success: false,
        error: botRes.error || 'رمز البوت غير صالح.'
      };
    }

    const botName = botRes.bot.username ? `@${botRes.bot.username}` : botRes.bot.first_name;

    // 2. Send Test Message
    const testMessage = `<b>🔔 اختبار نظام إشعارات نكسورا (Nexora)</b>\n\n` +
      `✅ <b>حالة الاتصال:</b> متصل بنجاح 🟢\n` +
      `🤖 <b>اسم البوت:</b> ${botName}\n` +
      `💬 <b>معرّف المحادثة:</b> <code>${chatId}</code>\n` +
      `⏰ <b>توقيت الخادم:</b> ${new Date().toLocaleString('ar-EG')}\n\n` +
      `<i>✨ ستصلك جميع إشعارات المنصة (تسجيل المستخدمين، الإيداعات، السحوبات، النزاعات) إلى هذه المحادثة فور حدوثها.</i>`;

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      await axios.post(url, {
        chat_id: chatId,
        text: testMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }, { timeout: 10000 });

      return {
        success: true,
        botInfo: botRes.bot,
        message: `تم إرسال رسالة الاختبار بنجاح إلى البوت ${botName} في المحادثة (${chatId})!`
      };
    } catch (error: any) {
      const desc = error.response?.data?.description || error.message;
      let errorGuide = desc;

      if (desc.includes('chat not found') || desc.includes('Bad Request: chat not found')) {
        errorGuide = `لم يتم العثور على المحادثة (${chatId}). تأكد من فتح البوت (${botName}) والضغط على زر /start، أو إذا كانت قناة/مجموعة تأكد من إضافة البوت إليها كـ Admin.`;
      } else if (desc.includes('bot was blocked by the user')) {
        errorGuide = `المستخدم قام بحظر البوت. يرجى فتح البوت (${botName}) في تليغرام والضغط على Unblock ثم /start.`;
      } else if (desc.includes('bot is not a member') || desc.includes('not enough rights')) {
        errorGuide = `البوت ليس عضواً في القناة أو المجموعة (${chatId}) أو ليس لديه صلاحية النشر. يرجى إضافته كـ Admin مع صلاحية Post Messages.`;
      }

      return {
        success: false,
        botInfo: botRes.bot,
        error: errorGuide
      };
    }
  }

  // Core Send Message Method
  async sendMessage(htmlText: string, options?: { forceSend?: boolean }) {
    const settings = await this.getSettings();
    if (!settings.enabled && !options?.forceSend) {
      console.log('[TelegramService] Notifications are disabled in settings.');
      return null;
    }

    const { botToken, chatId } = settings;
    if (!botToken || !chatId) {
      console.warn('[TelegramService] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID. Notification skipped.');
      return null;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const response = await axios.post(url, {
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }, { timeout: 10000 });

      console.log('[TelegramService] Message delivered successfully. Message ID:', response.data.result?.message_id);
      return response.data;
    } catch (error: any) {
      const desc = error.response?.data?.description || error.message;
      console.error('[TelegramService] HTML send failed:', desc, 'Retrying with plain text...');

      // Fallback: Strip HTML tags and send as plain text to prevent losing the notification
      try {
        const plainText = htmlText.replace(/<[^>]*>?/gm, '');
        const retryResponse = await axios.post(url, {
          chat_id: chatId,
          text: plainText
        }, { timeout: 10000 });
        console.log('[TelegramService] Fallback plain-text delivered:', retryResponse.data.result?.message_id);
        return retryResponse.data;
      } catch (fallbackError: any) {
        console.error('[TelegramService] Fatal delivery error:', fallbackError.response?.data?.description || fallbackError.message);
        return null;
      }
    }
  }

  // --- Specific Pre-formatted Event Notifications ---

  async notifyNewUser(user: { 
    id?: string; 
    username: string; 
    email: string; 
    efootballUsername?: string;
    jawakerUsername?: string;
    gameUsername?: string; 
    role?: string 
  }) {
    const settings = await this.getSettings();
    if (!settings.notifyUsers) return;

    const message = `👤 <b>مستخدم جديد انضم للمنصة!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🏷️ <b>اسم المستخدم:</b> <code>${user.username}</code>\n` +
      `⚽ <b>حساب eFootball:</b> <code>${user.efootballUsername || user.gameUsername || 'غير محدد'}</code>\n` +
      `🃏 <b>حساب Jawaker:</b> <code>${user.jawakerUsername || 'غير محدد'}</code>\n` +
      `📧 <b>البريد:</b> ${user.email}\n` +
      `👑 <b>الرتبة:</b> ${user.role || 'USER'}\n` +
      `⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}`;

    return this.sendMessage(message);
  }

  async notifyDepositRequest(data: { userId: string; username?: string; amount: string; method?: string; referenceId?: string }) {
    const settings = await this.getSettings();
    if (!settings.notifyDeposits) return;

    const message = `💰 <b>طلب إيداع جديد قيد المراجعة!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>المستخدم:</b> <code>${data.username || data.userId}</code>\n` +
      `💵 <b>المبلغ:</b> <b>$${Number(data.amount).toFixed(2)} USD</b>\n` +
      `💳 <b>طريقة الدفع:</b> ${data.method || 'تحويل بنكي / محفظة'}\n` +
      `🔖 <b>المرجع (Ref):</b> <code>${data.referenceId || 'N/A'}</code>\n` +
      `⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}\n\n` +
      `<i>👉 يرجى مراجعة وتأكيد الطلب من لوحة تحكم الإدارة.</i>`;

    return this.sendMessage(message);
  }

  async notifyDepositStatus(data: { userId: string; username?: string; amount: string; status: 'APPROVED' | 'REJECTED'; reason?: string }) {
    const settings = await this.getSettings();
    if (!settings.notifyDeposits) return;

    const isApproved = data.status === 'APPROVED';
    const message = `${isApproved ? '✅' : '❌'} <b>تم ${isApproved ? 'قبول' : 'رفض'} طلب إيداع</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>المستخدم:</b> <code>${data.username || data.userId}</code>\n` +
      `💵 <b>المبلغ:</b> $${Number(data.amount).toFixed(2)}\n` +
      `📊 <b>الحالة:</b> ${isApproved ? 'مكتمل وتمت إضافة الرصيد' : 'مرفوض'}\n` +
      (data.reason ? `📝 <b>السبب:</b> ${data.reason}\n` : '') +
      `⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}`;

    return this.sendMessage(message);
  }

  async notifyWithdrawalRequest(data: { userId: string; username?: string; amount: string; referenceId?: string; details?: any }) {
    const settings = await this.getSettings();
    if (!settings.notifyWithdrawals) return;

    const message = `💸 <b>طلب سحب جديد قيد المراجعة!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>المستخدم:</b> <code>${data.username || data.userId}</code>\n` +
      `💵 <b>المبلغ المطلوب:</b> <b>$${Number(data.amount).toFixed(2)} USD</b>\n` +
      `🔖 <b>المرجع:</b> <code>${data.referenceId || 'N/A'}</code>\n` +
      `⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}\n\n` +
      `<i>👉 يرجى مراجعة بيانات السحب في لوحة التحكم واتخاذ الإجراء.</i>`;

    return this.sendMessage(message);
  }

  async notifyWithdrawalStatus(data: { userId: string; username?: string; amount: string; status: 'APPROVED' | 'REJECTED'; reason?: string }) {
    const settings = await this.getSettings();
    if (!settings.notifyWithdrawals) return;

    const isApproved = data.status === 'APPROVED';
    const message = `${isApproved ? '✅' : '❌'} <b>تم ${isApproved ? 'تنفيذ' : 'رفض'} طلب سحب</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>المستخدم:</b> <code>${data.username || data.userId}</code>\n` +
      `💵 <b>المبلغ:</b> $${Number(data.amount).toFixed(2)}\n` +
      `📊 <b>الحالة:</b> ${isApproved ? 'تم التحويل بنجاح' : 'مرفوض وإعادة الرصيد للمحفظة'}\n` +
      (data.reason ? `📝 <b>السبب:</b> ${data.reason}\n` : '') +
      `⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}`;

    return this.sendMessage(message);
  }

  async notifyDispute(data: { matchId: string; raisedBy: string; opponent?: string; gameName?: string; stakeAmount?: string; prize?: string; reason?: string; evidenceUrl?: string }) {
    const settings = await this.getSettings();
    if (!settings.notifyDisputes) return;

    const message = `🚨 <b>تم فتح نزاع / اعتراض على نتيجة مباراة!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🎮 <b>اللعبة:</b> ${data.gameName || 'مباراة تحدي'}\n` +
      `🆔 <b>رقم المباراة:</b> <code>${data.matchId}</code>\n` +
      `👤 <b>مقدم الاعتراض:</b> <code>${data.raisedBy}</code>\n` +
      (data.opponent ? `⚔️ <b>الخصم:</b> <code>${data.opponent}</code>\n` : '') +
      (data.stakeAmount ? `💰 <b>الرهان:</b> $${data.stakeAmount} | <b>الجائزة:</b> $${data.prize || 'N/A'}\n` : '') +
      `📝 <b>السبب:</b> ${data.reason || 'اعتراض على النتيجة المُسجلة'}\n` +
      (data.evidenceUrl ? `📸 <b>رابط الإثبات:</b> <a href="${data.evidenceUrl}">اضغط للمعاينة</a>\n` : '') +
      `⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}\n\n` +
      `<i>👉 يتطلب تدخل المشرف لحسم النتيجة من لوحة النزاعات.</i>`;

    return this.sendMessage(message);
  }

  async notifyDisputeResolved(data: { matchId: string; resolution: string; adminUsername?: string }) {
    const settings = await this.getSettings();
    if (!settings.notifyDisputes) return;

    const message = `⚖️ <b>تم حسم النزاع رسمياً بواسطة المشرف</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 <b>المباراة:</b> <code>${data.matchId}</code>\n` +
      `📋 <b>القرار:</b> <b>${data.resolution}</b>\n` +
      `👮 <b>المشرف:</b> <code>${data.adminUsername || 'Admin'}</code>\n` +
      `⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}`;

    return this.sendMessage(message);
  }

  async notifyAdminAdjustment(data: { targetUsername: string; type: 'CREDIT' | 'DEBIT'; amount: string; adminUsername: string; reason: string; newBalance?: string }) {
    const isCredit = data.type === 'CREDIT';
    const message = `🛠️ <b>تعديل يدوي لرصيد مستخدم (Admin)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>المستخدم:</b> <code>${data.targetUsername}</code>\n` +
      `💵 <b>العملية:</b> ${isCredit ? '➕ إضافة رصيد' : '➖ خصم رصيد'} بمقدار <b>$${Number(data.amount).toFixed(2)}</b>\n` +
      `👮 <b>المشرف:</b> <code>${data.adminUsername}</code>\n` +
      `📝 <b>السبب:</b> ${data.reason}\n` +
      (data.newBalance ? `💰 <b>الرصيد الجديد:</b> $${Number(data.newBalance).toFixed(2)}\n` : '') +
      `⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}`;

    return this.sendMessage(message);
  }
}

export const telegramService = new TelegramService();

