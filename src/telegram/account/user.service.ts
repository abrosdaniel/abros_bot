import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';
import { NocoDBService } from '../../database/nocodb.service';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

@Injectable()
export class UserService {
  constructor(private readonly nocodbService: NocoDBService) {}

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
      return roles.length > 0 ? roles.join('\n') : 'Нет ролей';
    }

    return 'Нет ролей';
  }

  private formatSubscriptions(
    subscriptions: string | string[] | null | undefined,
  ): string {
    if (!subscriptions) return 'Нет подписок';

    if (typeof subscriptions === 'string') {
      return subscriptions || 'Нет подписок';
    }

    if (Array.isArray(subscriptions)) {
      return subscriptions.length > 0
        ? subscriptions.join('\n')
        : 'Нет подписок';
    }

    return 'Нет подписок';
  }

  private formatServices(
    services: string | string[] | null | undefined,
  ): string {
    if (!services) return 'Нет сервисов';

    if (typeof services === 'string') {
      return services || 'Нет сервисов';
    }

    if (Array.isArray(services)) {
      return services.length > 0 ? services.join('\n') : 'Нет сервисов';
    }

    return 'Нет сервисов';
  }

  async getAccountInfo(telegramId: string) {
    const user = await this.nocodbService.findUser(telegramId);
    if (!user) return null;

    return `📱 Ваш профиль:

🆔
├ Системный: ${user.user_id}
└ Telegram: ${user.telegram_id}

👤 
├ Имя: ${user.first_name || 'Не указано'}
├ Фамилия: ${user.last_name || 'Не указана'}
├ Email: ${user.email || 'Не указан'}
└ Телефон: ${user.phone || 'Не указан'}

📅
└ Регистрация ${this.formatDate(user.CreatedAt)}

🔑 Роли:
${this.formatRoles(user.roles)}

🗂️ Подписки:
${this.formatSubscriptions(user.subscriptions)}

🛠️ Сервисы:
${this.formatServices(user.services)}`;
  }

  async getAccountKeyboard(telegramId: string) {
    const buttons = [
      [
        Markup.button.callback('🗂️ Мои подписки', 'my_subscriptions'),
        Markup.button.callback('🛠️ Мои сервисы', 'my_services'),
      ],
      [Markup.button.callback('✏️ Редактировать профиль', 'edit_account')],
    ];

    buttons.push([Markup.button.callback('↩️ Назад', 'back_to_main')]);

    return Markup.inlineKeyboard(buttons);
  }

  async getServicesKeyboard(telegramId: string) {
    const user = await this.nocodbService.findUser(telegramId);
    const buttons = [];

    if (user?.services?.includes('Exchange')) {
      buttons.push([Markup.button.callback(`💱 Обменник`, 'exchange')]);
    }

    buttons.push([Markup.button.callback('↩️ Назад', 'back_to_profile')]);

    return Markup.inlineKeyboard(buttons);
  }

  async getSubscriptionsKeyboard(telegramId: string) {
    const user = await this.nocodbService.findUser(telegramId);
    const buttons = [];

    if (user?.subscriptions && user.subscriptions.length > 0) {
      user.subscriptions.forEach((subscription) => {
        buttons.push([Markup.button.callback(`📢 ${subscription}`, 'none')]);
      });
    }

    buttons.push([Markup.button.callback('↩️ Назад', 'back_to_profile')]);

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
            'Неверный формат телефона. Пожалуйста, введите новый номер телефона в международном формате (например: +79001234567)',
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
    try {
      const phoneNumber = parsePhoneNumberFromString(phone);
      return phoneNumber?.isValid() || false;
    } catch (error) {
      return false;
    }
  }

  async isDeveloperUser(telegramId: string): Promise<boolean> {
    const user = await this.nocodbService.findUser(telegramId);
    return user?.roles?.includes('Developer') || false;
  }
}
