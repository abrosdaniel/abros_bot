import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';
import { NocoDBService } from '../database/nocodb.service';

@Injectable()
export class AdminService {
  private readonly USERS_PER_PAGE = 5;

  constructor(private readonly nocodbService: NocoDBService) {}

  private hasAdminRole(roles: string[]): boolean {
    return roles?.includes('Admin') || false;
  }

  async isAdmin(telegramId: string): Promise<boolean> {
    const user = await this.nocodbService.findUser(telegramId);
    return this.hasAdminRole(user?.roles);
  }

  getAdminKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('👥 Управление пользователями', 'admin_users')],
      [Markup.button.callback('📢 Отправить новость', 'admin_send_news')],
      [Markup.button.callback('↩️ Назад', 'back_to_main')],
    ]);
  }

  async getUsersPage(
    page: number = 1,
  ): Promise<{ users: any[]; totalPages: number }> {
    const allUsers = await this.nocodbService.getAllUsers();
    const totalPages = Math.ceil(allUsers.length / this.USERS_PER_PAGE);
    const startIndex = (page - 1) * this.USERS_PER_PAGE;
    const endIndex = startIndex + this.USERS_PER_PAGE;
    const users = allUsers.slice(startIndex, endIndex);
    return { users, totalPages };
  }

  async getUsersListKeyboard(page: number = 1) {
    const { users, totalPages } = await this.getUsersPage(page);

    const buttons = users.map((user) => [
      Markup.button.callback(
        `${user.user_id} | ${user.first_name || 'Без имени'} ${user.last_name || ''}`,
        `admin_user_${user.user_id}`,
      ),
    ]);

    const paginationButtons = [];
    if (page > 1) {
      paginationButtons.push(
        Markup.button.callback('◀️', `admin_users_page_${page - 1}`),
      );
    }
    paginationButtons.push(
      Markup.button.callback(
        `${page}/${totalPages}`,
        'admin_users_current_page',
      ),
    );
    if (page < totalPages) {
      paginationButtons.push(
        Markup.button.callback('▶️', `admin_users_page_${page + 1}`),
      );
    }
    buttons.push(paginationButtons);

    buttons.push([Markup.button.callback('↩️ Назад', 'back_to_admin')]);

    return Markup.inlineKeyboard(buttons);
  }

  async getUserControlKeyboard(userId: string) {
    const user = await this.nocodbService.findUserById(userId);
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(
          user.block === 1 ? '✅ Разблокировать' : '❌ Заблокировать',
          `admin_toggle_block_${userId}`,
        ),
      ],
      [Markup.button.callback('↩️ Назад', 'admin_users')],
    ]);
  }

  async toggleUserBlock(
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.nocodbService.findUserById(userId);
      if (!user) {
        return { success: false, message: '⚠️ Пользователь не найден' };
      }

      const newBlockStatus = user.block === 1 ? 0 : 1;
      await this.nocodbService.updateUser(user.telegram_id, {
        block: newBlockStatus,
      });

      return {
        success: true,
        message: `Пользователь ${user.first_name || 'Без имени'} ${user.last_name || ''} ${newBlockStatus === 1 ? 'заблокирован' : 'разблокирован'}`,
      };
    } catch (error) {
      console.error('Error toggling user block:', error);
      return {
        success: false,
        message: 'Ошибка при изменении статуса блокировки',
      };
    }
  }
}
