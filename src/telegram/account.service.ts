import { Injectable } from '@nestjs/common';
import { Context } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { NocoDBService } from '../database/nocodb.service';
import { TipTopService } from './clients/tiptop/tiptop.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly nocodbService: NocoDBService,
    private readonly tiptopService: TipTopService,
  ) {}

  private formatDate(dateString: string): string {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Не указана';
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private formatRoles(roles: string | string[] | null | undefined): string {
    if (!roles) return 'Нет ролей';

    if (typeof roles === 'string') {
      return roles || 'Нет ролей';
    }

    if (Array.isArray(roles)) {
      return roles.length > 0 ? roles.join(', ') : 'Нет ролей';
    }

    return 'Нет ролей';
  }

  private formatSubscriptions(subscriptions: string[]): string {
    if (!subscriptions || subscriptions.length === 0) return 'Нет подписок';
    return subscriptions.join('\n');
  }

  async getAccountInfo(telegramId: string) {
    const user = await this.nocodbService.findUser(telegramId);
    if (!user) return null;

    return `📱 Ваш профиль:
🆔 Системный: ${user.user_id}
🆔 Telegram: ${user.telegram_id}
👤 Имя: ${user.first_name || 'Не указано'}
👤 Фамилия: ${user.last_name || 'Не указана'}
📮 Email: ${user.email || 'Не указан'}
📞 Телефон: ${user.phone || 'Не указан'}
🔑 Роли: ${this.formatRoles(user.roles)}
📅 Зарегистрирован: ${this.formatDate(user.CreatedAt)}

🗂️ Подписки:
${this.formatSubscriptions(user.subscriptions)}`;
  }

  async getAccountKeyboard(telegramId: string) {
    const buttons = [
      [Markup.button.callback('✏️ Редактировать профиль', 'edit_account')],
    ];

    const hasTipTopAccess = await this.tiptopService.isTipTopUser(telegramId);
    if (hasTipTopAccess) {
      buttons.push([Markup.button.callback('🚘 TipTop', 'tiptop')]);
    }

    buttons.push([Markup.button.callback('↩️ Назад', 'back_to_main')]);

    return Markup.inlineKeyboard(buttons);
  }

  getEditKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('📮 Email', 'edit_email')],
      [Markup.button.callback('📞 Телефон', 'edit_phone')],
      [Markup.button.callback('↩️ Назад', 'back_to_profile')],
    ]);
  }

  async updateUserData(
    telegramId: string,
    field: 'email' | 'phone',
    value: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (field === 'email' && !this.isValidEmail(value)) {
        return {
          success: false,
          message:
            'Неверный формат email. Пожалуйста, введите корректный email.',
        };
      }

      if (field === 'phone' && !this.isValidPhone(value)) {
        return {
          success: false,
          message:
            'Неверный формат телефона. Пожалуйста, введите номер в формате +XXXXXXXXXXX.',
        };
      }

      await this.nocodbService.updateUser(telegramId, { [field]: value });

      return {
        success: true,
        message: `${field === 'email' ? 'Email' : 'Телефон'} успешно обновлен.`,
      };
    } catch (error) {
      console.error('Error updating user data:', error);
      return {
        success: false,
        message:
          'Произошла ошибка при обновлении данных. Пожалуйста, попробуйте позже.',
      };
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+7\d{10}$/;
    return phoneRegex.test(phone);
  }
}
