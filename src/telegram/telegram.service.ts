import { Injectable } from '@nestjs/common';
import { Context, On, Start, Update } from 'nestjs-telegraf';
import { NocoDBService } from '../database/nocodb.service';
import { Markup } from 'telegraf';
import { AccountService } from './account.service';
import { AdminService } from './admin.service';
import { TipTopService } from './clients/tiptop/tiptop.service';
import { MyContext } from './types/context.types';
import { Telegraf } from 'telegraf';

@Update()
@Injectable()
export class TelegramService {
  private editingStates: Map<number, { field: 'email' | 'phone' }> = new Map();
  private bot: Telegraf<MyContext>;

  constructor(
    private readonly nocodbService: NocoDBService,
    private readonly accountService: AccountService,
    private readonly adminService: AdminService,
    private readonly tiptopService: TipTopService,
  ) {
    this.bot = new Telegraf<MyContext>(process.env.BOT_TOKEN);
  }

  getBot(): Telegraf<MyContext> {
    return this.bot;
  }

  private async updateUserIfNeeded(
    telegramId: string,
    username: string,
    firstName: string,
    lastName: string,
  ) {
    const user = await this.nocodbService.findUser(telegramId);

    if (user) {
      // Проверяем, изменились ли данные
      const needsUpdate =
        user.telegram_username !== username ||
        user.first_name !== firstName ||
        user.last_name !== lastName;

      if (needsUpdate) {
        await this.nocodbService.updateUser(telegramId, {
          telegram_username: username,
          first_name: firstName,
          last_name: lastName,
        });
        return await this.nocodbService.findUser(telegramId);
      }
    }

    return user;
  }

  private async getMainKeyboard(telegramId: string) {
    const isAdmin = await this.adminService.isAdmin(telegramId);
    const buttons = [
      [
        Markup.button.callback('👤 Аккаунт', 'account'),
        Markup.button.callback('💼 Портфолио', 'portfolio'),
      ],
      [
        Markup.button.callback('💬 Связь', 'contact'),
        Markup.button.callback('💸 Донат', 'donate'),
      ],
    ];

    if (isAdmin) {
      buttons.push([Markup.button.callback('🔐 Админка', 'admin')]);
    }

    return Markup.inlineKeyboard(buttons);
  }

  @Start()
  async start(@Context() ctx: any) {
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name;

    const isBlocked = await this.nocodbService.isUserBlocked(telegramId);
    if (isBlocked) {
      await ctx.reply(
        '⚠️ Доступ к боту заблокирован. Пожалуйста, свяжитесь с @et0daniel для разблокировки.',
      );
      return;
    }

    let user = await this.updateUserIfNeeded(
      telegramId,
      username,
      firstName,
      lastName,
    );

    if (!user) {
      user = await this.nocodbService.createUser({
        telegram_id: telegramId,
        telegram_username: username,
        first_name: firstName,
        last_name: lastName,
      });
    }

    await ctx.reply(
      `👋🏻 Привет, ${user.first_name}!\n\nВ этом боте собрано много функционала и он постоянно пополняется новыми возможностями.\n\nДавай начнем! 🚀`,
      await this.getMainKeyboard(telegramId),
    );
  }

  @On('callback_query')
  async onCallbackQuery(@Context() ctx: any) {
    const action = ctx.callbackQuery.data;
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name;

    const isBlocked = await this.nocodbService.isUserBlocked(telegramId);
    if (isBlocked) {
      await ctx.answerCbQuery('⚠️ Доступ к боту заблокирован');
      return;
    }

    await this.updateUserIfNeeded(telegramId, username, firstName, lastName);

    if (action === 'tiptop') {
      const isTipTopUser = await this.tiptopService.isTipTopUser(telegramId);
      if (!isTipTopUser) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к TipTop');
        return;
      }
      await ctx.editMessageText(
        'Главное меню сервиса TipTop',
        this.tiptopService.getTipTopKeyboard(),
      );
      return;
    }

    if (action === 'tiptop_exchange') {
      const isTipTopUser = await this.tiptopService.isTipTopUser(telegramId);
      if (!isTipTopUser) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к TipTop');
        return;
      }
      await ctx.editMessageText(
        '💱 Курсы валют:',
        await this.tiptopService.getExchangeKeyboard(),
      );
      return;
    }

    if (action === 'tiptop_publish_rates') {
      const isTipTopUser = await this.tiptopService.isTipTopUser(telegramId);
      if (!isTipTopUser) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к TipTop');
        return;
      }
      await this.tiptopService.handleResourceAction(ctx, action);
      return;
    }

    if (
      action.startsWith('tiptop_currency_buy_percent_') ||
      action.startsWith('tiptop_currency_sell_percent_')
    ) {
      const isTipTopUser = await this.tiptopService.isTipTopUser(telegramId);
      if (!isTipTopUser) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к TipTop');
        return;
      }
      await this.tiptopService.handleCurrencyAction(ctx, action);
      return;
    }

    if (action.startsWith('tiptop_currency_')) {
      if (!(await this.tiptopService.isTipTopUser(telegramId))) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к TipTop');
        return;
      }
      await this.tiptopService.handleCurrencyAction(ctx, action);
      return;
    }

    if (
      action === 'tiptop_resources' ||
      action.startsWith('tiptop_resource_') ||
      action.startsWith('tiptop_resources_page_') ||
      action === 'tiptop_add_resource'
    ) {
      if (!(await this.tiptopService.isTipTopUser(telegramId))) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к TipTop');
        return;
      }
      await this.tiptopService.handleResourceAction(ctx, action);
      return;
    }

    if (action === 'back_to_account') {
      const accountInfo = await this.accountService.getAccountInfo(telegramId);
      if (accountInfo) {
        await ctx.editMessageText(
          accountInfo,
          await this.accountService.getAccountKeyboard(telegramId),
        );
      }
      return;
    }

    if (action.startsWith('admin_users_page_')) {
      const isAdmin = await this.adminService.isAdmin(telegramId);
      if (!isAdmin) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к админ-панели');
        return;
      }
      const page = parseInt(action.split('_')[3]);
      await ctx.editMessageText(
        '👥 Список пользователей:',
        await this.adminService.getUsersListKeyboard(page),
      );
      return;
    }

    if (action.startsWith('admin_user_')) {
      const isAdmin = await this.adminService.isAdmin(telegramId);
      if (!isAdmin) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к админ-панели');
        return;
      }
      const userId = action.split('_')[2];
      const user = await this.nocodbService.findUserById(userId);
      if (!user) {
        await ctx.answerCbQuery('☹️ Пользователь не найден');
        return;
      }
      await ctx.editMessageText(
        `👤 Пользователь: ${user.first_name || 'Без имени'} ${user.last_name || ''}\n` +
          `🆔 Системный: ${user.user_id}\n` +
          `🆔 Telegram: ${user.telegram_id}\n` +
          `🏷 Username: ${user.telegram_username}\n` +
          `📮 Почта: ${user.email}\n` +
          `📞 Телефон: ${user.phone}\n` +
          `Статус: ${user.block === 1 ? '🚫 Заблокирован' : '🟢 Активен'}`,
        await this.adminService.getUserControlKeyboard(userId),
      );
      return;
    }

    if (action.startsWith('admin_toggle_block_')) {
      const isAdmin = await this.adminService.isAdmin(telegramId);
      if (!isAdmin) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к админ-панели');
        return;
      }
      const userId = action.split('_')[3];
      const result = await this.adminService.toggleUserBlock(userId);
      await ctx.answerCbQuery(result.message);
      if (result.success) {
        const user = await this.nocodbService.findUserById(userId);
        await ctx.editMessageText(
          `👤 Пользователь: ${user.first_name || 'Без имени'} ${user.last_name || ''}\n` +
            `🆔 Системный: ${user.user_id}\n` +
            `🆔 Telegram: ${user.telegram_id}\n` +
            `🏷 Username: ${user.telegram_username}\n` +
            `📮 Почта: ${user.email}\n` +
            `📞 Телефон: ${user.phone}\n` +
            `Статус: ${user.block === 1 ? '🚫 Заблокирован' : '🟢 Активен'}`,
          await this.adminService.getUserControlKeyboard(userId),
        );
      }
      return;
    }

    if (action === 'admin_send_news') {
      if (!(await this.adminService.isAdmin(telegramId))) {
        await ctx.answerCbQuery('У вас нет доступа к админке');
        return;
      }
      ctx.session.waitingForNews = true;
      await ctx.editMessageText(
        'Отправьте медиа-сообщение (фото, видео, документ) с текстом для рассылки:',
        Markup.inlineKeyboard([
          [Markup.button.callback('↩️ Назад', 'back_to_admin')],
        ]),
      );
      return;
    }

    switch (action) {
      case 'admin': {
        const isAdmin = await this.adminService.isAdmin(telegramId);
        if (!isAdmin) {
          await ctx.answerCbQuery('⚠️ У вас нет доступа к админ-панели');
          return;
        }
        await ctx.editMessageText(
          '🔐 Админ-панель',
          this.adminService.getAdminKeyboard(),
        );
        break;
      }
      case 'admin_users': {
        const isAdmin = await this.adminService.isAdmin(telegramId);
        if (!isAdmin) {
          await ctx.answerCbQuery('⚠️ У вас нет доступа к админ-панели');
          return;
        }
        await ctx.editMessageText(
          '👥Список пользователей:',
          await this.adminService.getUsersListKeyboard(),
        );
        break;
      }
      case 'back_to_admin': {
        const isAdmin = await this.adminService.isAdmin(telegramId);
        if (!isAdmin) {
          await ctx.answerCbQuery('⚠️ У вас нет доступа к админ-панели');
          return;
        }
        await ctx.editMessageText(
          '🔐 Админ-панель',
          this.adminService.getAdminKeyboard(),
        );
        break;
      }
      case 'account': {
        const accountInfo =
          await this.accountService.getAccountInfo(telegramId);
        if (accountInfo) {
          await ctx.editMessageText(
            accountInfo,
            await this.accountService.getAccountKeyboard(telegramId),
          );
        }
        break;
      }
      case 'edit_account': {
        await ctx.editMessageText(
          '✏️ Выберите данные для редактирования:',
          this.accountService.getEditKeyboard(),
        );
        break;
      }
      case 'edit_email': {
        this.editingStates.set(ctx.from.id, { field: 'email' });
        await ctx.editMessageText(
          '📮 Введите новый email:',
          Markup.inlineKeyboard([
            [Markup.button.callback('❌ Отмена', 'back_to_profile')],
          ]),
        );
        break;
      }
      case 'edit_phone': {
        this.editingStates.set(ctx.from.id, { field: 'phone' });
        await ctx.editMessageText(
          '📞 Введите новый номер телефона в формате +XXXXXXXXXXX:',
          Markup.inlineKeyboard([
            [Markup.button.callback('❌ Отмена', 'back_to_profile')],
          ]),
        );
        break;
      }
      case 'back_to_profile': {
        const accountInfo =
          await this.accountService.getAccountInfo(telegramId);
        if (accountInfo) {
          await ctx.editMessageText(
            accountInfo,
            await this.accountService.getAccountKeyboard(telegramId),
          );
        }
        this.editingStates.delete(ctx.from.id);
        break;
      }
      case 'back_to_main': {
        const user = await this.nocodbService.findUser(telegramId);
        await ctx.editMessageText(
          `👋🏻 Привет, ${user.first_name}!
      
      В этом боте собрано много функционала и он постоянно пополняется новыми возможностями.
      
      Давай начнем! 🚀`,
          await this.getMainKeyboard(telegramId),
        );
        break;
      }
      case 'portfolio':
        await ctx.editMessageText(
          'В разработке...',
          await this.getMainKeyboard(telegramId),
        );
        break;
      case 'contact':
        await ctx.editMessageText(
          'В разработке...',
          await this.getMainKeyboard(telegramId),
        );
        break;
      case 'donate':
        await ctx.editMessageText(
          'В разработке...',
          await this.getMainKeyboard(telegramId),
        );
        break;
    }

    await ctx.answerCbQuery();
  }

  @On('text')
  async onText(@Context() ctx: MyContext) {
    const telegramId = ctx.from.id.toString();
    const isBlocked = await this.nocodbService.isUserBlocked(telegramId);
    if (isBlocked) {
      await ctx.reply('⚠️ Доступ к боту заблокирован');
      return;
    }

    if (ctx.session.waitingForPercent) {
      await this.tiptopService.handleCurrencyAction(
        ctx,
        `tiptop_currency_${ctx.session.waitingForPercent.type}_percent_${ctx.session.waitingForPercent.code}`,
      );
      return;
    }

    await this.tiptopService.handleTextMessage(ctx);
  }

  @On('photo')
  async onPhoto(@Context() ctx: MyContext) {
    if (ctx.session.waitingForNews && 'photo' in ctx.message) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const caption = 'caption' in ctx.message ? ctx.message.caption || '' : '';
      await this.sendNewsToAllUsers(ctx, {
        type: 'photo',
        file_id: photo.file_id,
        caption,
      });
      ctx.session.waitingForNews = undefined;
    }
  }

  @On('video')
  async onVideo(@Context() ctx: MyContext) {
    if (ctx.session.waitingForNews && 'video' in ctx.message) {
      const video = ctx.message.video;
      const caption = 'caption' in ctx.message ? ctx.message.caption || '' : '';
      await this.sendNewsToAllUsers(ctx, {
        type: 'video',
        file_id: video.file_id,
        caption,
      });
      ctx.session.waitingForNews = undefined;
    }
  }

  @On('document')
  async onDocument(@Context() ctx: MyContext) {
    if (ctx.session.waitingForNews && 'document' in ctx.message) {
      const document = ctx.message.document;
      const caption = 'caption' in ctx.message ? ctx.message.caption || '' : '';
      await this.sendNewsToAllUsers(ctx, {
        type: 'document',
        file_id: document.file_id,
        caption,
      });
      ctx.session.waitingForNews = undefined;
    }
  }

  private async sendNewsToAllUsers(
    ctx: MyContext,
    media: {
      type: 'photo' | 'video' | 'document';
      file_id: string;
      caption: string;
    },
  ) {
    const users = await this.nocodbService.getAllUsers();
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        if (user.block === 1) continue; // Пропускаем заблокированных пользователей

        switch (media.type) {
          case 'photo':
            await ctx.telegram.sendPhoto(user.telegram_id, media.file_id, {
              caption: media.caption,
            });
            break;
          case 'video':
            await ctx.telegram.sendVideo(user.telegram_id, media.file_id, {
              caption: media.caption,
            });
            break;
          case 'document':
            await ctx.telegram.sendDocument(user.telegram_id, media.file_id, {
              caption: media.caption,
            });
            break;
        }
        successCount++;
      } catch (error) {
        console.error(`Error sending news to user ${user.telegram_id}:`, error);
        errorCount++;
      }
    }

    await ctx.reply(
      `Рассылка завершена:\n✅ Успешно отправлено: ${successCount}\n❌ Ошибок: ${errorCount}`,
      this.adminService.getAdminKeyboard(),
    );
  }
}
