import { Injectable } from '@nestjs/common';
import { Context, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { NocoDBService } from '../database/nocodb.service';
import { Markup } from 'telegraf';
import { UserService } from './account/user.service';
import { AdminService } from './account/admin.service';
import { ExchangeService } from './services/exchange/exchange.service';
import { MyContext } from './types/context.types';
import { Telegraf } from 'telegraf';

@Update()
@Injectable()
export class TelegramUpdate {
  private editingStates: Map<number, { field: 'email' | 'phone' }> = new Map();

  constructor(
    @InjectBot()
    private bot: Telegraf<MyContext>,
    private readonly nocodbService: NocoDBService,
    private readonly accountService: UserService,
    private readonly adminService: AdminService,
    private readonly exchangeService: ExchangeService,
  ) {
    this.exchangeService.setBotInstance(this.bot);
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
      [Markup.button.callback('👤 Аккаунт', 'account')],
      [
        Markup.button.callback('💼 Портфолио', 'portfolio'),
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
      `👋🏻 Привет, ${user.first_name}!\n\n` +
        `В этом боте собрано много функционала и он постоянно пополняется новыми возможностями.\n\n` +
        `Давай начнем! 🚀`,
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

    if (action === 'exchange') {
      const isExchangeUser =
        await this.exchangeService.isExchangeUser(telegramId);
      if (!isExchangeUser) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к Обменнику');
        return;
      }
      await ctx.editMessageText(
        'Главное меню сервиса Обменник',
        this.exchangeService.getExchangeKeyboard(),
      );
      return;
    }

    if (action === 'exchange_rates') {
      const isExchangeUser =
        await this.exchangeService.isExchangeUser(telegramId);
      if (!isExchangeUser) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к Обменнику');
        return;
      }
      await ctx.editMessageText(
        '💱 Курсы валют:',
        await this.exchangeService.getCurrenciesKeyboard(),
      );
      return;
    }

    if (action === 'exchange_publish_rates') {
      const isExchangeUser =
        await this.exchangeService.isExchangeUser(telegramId);
      if (!isExchangeUser) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к Обменнику');
        return;
      }
      await this.exchangeService.handleResourceAction(ctx, action);
      return;
    }

    if (
      action.startsWith('exchange_currency_buy_percent_') ||
      action.startsWith('exchange_currency_sell_percent_')
    ) {
      const isExchangeUser =
        await this.exchangeService.isExchangeUser(telegramId);
      if (!isExchangeUser) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к Обменнику');
        return;
      }
      await this.exchangeService.handleCurrencyAction(ctx, action);
      return;
    }

    if (action.startsWith('exchange_currency_')) {
      if (!(await this.exchangeService.isExchangeUser(telegramId))) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к Обменнику');
        return;
      }
      await this.exchangeService.handleCurrencyAction(ctx, action);
      return;
    }

    if (
      action === 'exchange_resources' ||
      action.startsWith('exchange_resource_') ||
      action.startsWith('exchange_resources_page_') ||
      action === 'exchange_add_resource'
    ) {
      if (!(await this.exchangeService.isExchangeUser(telegramId))) {
        await ctx.answerCbQuery('⚠️ У вас нет доступа к Обменнику');
        return;
      }
      await this.exchangeService.handleResourceAction(ctx, action);
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

    if (action === 'back_to_services') {
      await ctx.editMessageText(
        '🛠️ Ваши сервисы:',
        await this.accountService.getServicesKeyboard(telegramId),
      );
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
        `🆔 Системный: ${user.user_id} | Telegram: ${user.telegram_id}

🏷 Username: ${user.telegram_username}
👤 Пользователь: ${user.first_name || 'Без имени'} ${user.last_name || ''}
📮 Почта: ${user.email}
📞 Телефон: ${user.phone}

Статус: ${user.block === 1 ? '🚫 Заблокирован' : '🟢 Активен'}`,
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
          `🆔 Системный: ${user.user_id} | Telegram: ${user.telegram_id}

🏷 Username: ${user.telegram_username}
👤 Пользователь: ${user.first_name || 'Без имени'} ${user.last_name || ''}
📮 Почта: ${user.email}
📞 Телефон: ${user.phone}

Статус: ${user.block === 1 ? '🚫 Заблокирован' : '🟢 Активен'}`,
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
          '📞 Введите новый номер телефона в международном формате (например: +79001234567):\n\n' +
            'Или нажмите "Отмена"',
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
      case 'my_services': {
        await ctx.editMessageText(
          '🛠️ Ваши сервисы:',
          await this.accountService.getServicesKeyboard(telegramId),
        );
        break;
      }
      case 'my_subscriptions': {
        await ctx.editMessageText(
          '🗂️ Ваши подписки:',
          await this.accountService.getSubscriptionsKeyboard(telegramId),
        );
        break;
      }
      case 'exchange': {
        const isExchangeUser =
          await this.exchangeService.isExchangeUser(telegramId);
        if (!isExchangeUser) {
          await ctx.answerCbQuery('⚠️ У вас нет доступа к Обменнику');
          return;
        }
        await ctx.editMessageText(
          'Главное меню сервиса Обменник',
          this.exchangeService.getExchangeKeyboard(),
        );
        break;
      }
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
      await this.exchangeService.handleCurrencyAction(
        ctx,
        `exchange_currency_${ctx.session.waitingForPercent.type}_percent_${ctx.session.waitingForPercent.code}`,
      );
      return;
    }

    // Обработка ввода данных профиля
    const editingState = this.editingStates.get(ctx.from.id);
    if (editingState && ctx.message && 'text' in ctx.message) {
      const input = ctx.message.text.trim();
      const result = await this.accountService.updateUserData(
        telegramId,
        editingState.field,
        input,
      );

      if (result.success) {
        await ctx.reply(result.message);
        const accountInfo =
          await this.accountService.getAccountInfo(telegramId);
        if (accountInfo) {
          await ctx.reply(
            accountInfo,
            await this.accountService.getAccountKeyboard(telegramId),
          );
        }
      } else {
        await ctx.reply(
          result.message + '\n\nПопробуйте еще раз или нажмите "Отмена"',
          Markup.inlineKeyboard([
            [Markup.button.callback('❌ Отмена', 'back_to_profile')],
          ]),
        );
        return;
      }

      this.editingStates.delete(ctx.from.id);
      return;
    }

    await this.exchangeService.handleTextMessage(ctx);
  }

  @On('photo')
  async onPhoto(@Context() ctx: MyContext) {
    if (ctx.session.waitingForNews && 'photo' in ctx.message) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const caption = 'caption' in ctx.message ? ctx.message.caption || '' : '';
      const { successCount, errorCount } =
        await this.adminService.sendNewsToAllUsers(ctx, {
          type: 'photo',
          file_id: photo.file_id,
          caption,
        });

      await ctx.reply(
        `Рассылка завершена:\n✅ Успешно отправлено: ${successCount}\n❌ Ошибок: ${errorCount}`,
        this.adminService.getAdminKeyboard(),
      );
      ctx.session.waitingForNews = undefined;
    }
  }

  @On('video')
  async onVideo(@Context() ctx: MyContext) {
    if (ctx.session.waitingForNews && 'video' in ctx.message) {
      const video = ctx.message.video;
      const caption = 'caption' in ctx.message ? ctx.message.caption || '' : '';
      const { successCount, errorCount } =
        await this.adminService.sendNewsToAllUsers(ctx, {
          type: 'video',
          file_id: video.file_id,
          caption,
        });

      await ctx.reply(
        `Рассылка завершена:\n✅ Успешно отправлено: ${successCount}\n❌ Ошибок: ${errorCount}`,
        this.adminService.getAdminKeyboard(),
      );
      ctx.session.waitingForNews = undefined;
    }
  }

  @On('document')
  async onDocument(@Context() ctx: MyContext) {
    if (ctx.session.waitingForNews && 'document' in ctx.message) {
      const document = ctx.message.document;
      const caption = 'caption' in ctx.message ? ctx.message.caption || '' : '';
      const { successCount, errorCount } =
        await this.adminService.sendNewsToAllUsers(ctx, {
          type: 'document',
          file_id: document.file_id,
          caption,
        });

      await ctx.reply(
        `Рассылка завершена:\n✅ Успешно отправлено: ${successCount}\n❌ Ошибок: ${errorCount}`,
        this.adminService.getAdminKeyboard(),
      );
      ctx.session.waitingForNews = undefined;
    }
  }
}
