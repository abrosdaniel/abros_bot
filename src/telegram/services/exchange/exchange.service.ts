import { Injectable } from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { NocoDBService } from '../../../database/nocodb.service';
import { ExchangeDBService } from '../../../database/services/exchange/exchange.service';
import { MyContext } from '../../types/context.types';

@Injectable()
export class ExchangeService {
  private bot: Telegraf;

  constructor(
    private readonly nocodbService: NocoDBService,
    private readonly exchangeDBService: ExchangeDBService,
  ) {}

  setBotInstance(bot: Telegraf) {
    this.bot = bot;
  }

  async isExchangeUser(telegramId: string): Promise<boolean> {
    const user = await this.nocodbService.findUser(telegramId);
    return user?.services?.includes('Exchange') || false;
  }

  getExchangeKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('💱 Курсы', 'exchange_rates')],
      [
        Markup.button.callback(
          '💬 Каналы/Чаты для публикаций',
          'exchange_resources',
        ),
      ],
      [Markup.button.callback('↩️ Назад', 'back_to_services')],
    ]);
  }

  async getCurrenciesKeyboard() {
    const currencies = await this.exchangeDBService.getCurrencies();
    const buttons = currencies.map((currency) => [
      Markup.button.callback(`${currency.Flag}${currency.Code}`, 'none'),
      Markup.button.callback(`${currency.Buy} ${currency.Symbol}`, 'none'),
      Markup.button.callback(`${currency.Sell} ${currency.Symbol}`, 'none'),
      Markup.button.callback(`✏️`, `exchange_currency_${currency.Code}`),
    ]);
    buttons.push([
      Markup.button.callback('📢 Опубликовать', 'exchange_publish_rates'),
      Markup.button.callback('↩️ Назад', 'exchange'),
    ]);
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('Валюта', 'none'),
        Markup.button.callback('Покупка', 'none'),
        Markup.button.callback('Продажа', 'none'),
        Markup.button.callback('⚙️', 'none'),
      ],
      ...buttons,
    ]);
  }

  async getCurrencyKeyboard(code: string) {
    const currency = await this.exchangeDBService.getCurrency(code);
    if (!currency) {
      return null;
    }

    const message =
      `⚙️ Настройки валюты ${currency.Flag}${currency.Code}\n\n` +
      `Покупка\n` +
      `💱 Обменник: ${currency.Buy}\n` +
      `🏦 Банк: ${currency.BuyParse}\n` +
      `💰 Ваш процент: ${currency.BuyProcent}\n\n` +
      `Продажа\n` +
      `💱 Обменник: ${currency.Sell}\n` +
      `🏦 Банк: ${currency.SellParse}\n` +
      `💰 Ваш процент: ${currency.SellProcent}`;

    return {
      text: message,
      keyboard: Markup.inlineKeyboard([
        [
          Markup.button.callback(
            'Изменить % Покупки',
            `exchange_currency_buy_percent_${currency.Code}`,
          ),
          Markup.button.callback(
            'Изменить % Продажи',
            `exchange_currency_sell_percent_${currency.Code}`,
          ),
        ],
        [Markup.button.callback('↩️ Назад', 'exchange_rates')],
      ]),
    };
  }

  async handleCurrencyAction(ctx: MyContext, action: string) {
    let code: string;
    let type: 'buy' | 'sell' | null = null;

    if (action.startsWith('exchange_currency_buy_percent_')) {
      code = action.replace('exchange_currency_buy_percent_', '');
      type = 'buy';
    } else if (action.startsWith('exchange_currency_sell_percent_')) {
      code = action.replace('exchange_currency_sell_percent_', '');
      type = 'sell';
    } else {
      code = action.replace('exchange_currency_', '');
    }

    const currency = await this.exchangeDBService.getCurrency(code);
    if (!currency) {
      await ctx.answerCbQuery('Валюта не найдена');
      return;
    }

    if (ctx.session.waitingForPercent && ctx.message && 'text' in ctx.message) {
      const input = ctx.message.text.trim();
      const isPercentage = input.endsWith('%');
      const value = parseFloat(isPercentage ? input.slice(0, -1) : input);

      if (isNaN(value) || value < 0) {
        await ctx.reply(
          '❌ Неверный формат. Введите положительное число или процент (например: 5 или 5%)\n\n' +
            'Или нажмите "Отмена"',
          Markup.inlineKeyboard([
            [Markup.button.callback('❌ Отмена', 'exchange_rates')],
          ]),
        );
        return;
      }

      const updatedCurrency = await this.exchangeDBService.updateCurrencyValue(
        code,
        value,
        isPercentage,
        type,
      );

      if (!updatedCurrency) {
        await ctx.reply(
          '❌ Ошибка при обновлении значения\n\n' +
            'Попробуйте еще раз или нажмите "Отмена"',
          Markup.inlineKeyboard([
            [Markup.button.callback('❌ Отмена', 'exchange_rates')],
          ]),
        );
        return;
      }

      await ctx.reply(
        `✅ Значение ${type === 'buy' ? 'покупки' : 'продажи'} успешно обновлено до ${input}\n` +
          `Новые цены:\n` +
          `Покупка: ${updatedCurrency.Buy} ${updatedCurrency.Symbol}\n` +
          `Продажа: ${updatedCurrency.Sell} ${updatedCurrency.Symbol}`,
        await this.getCurrenciesKeyboard(),
      );
      ctx.session.waitingForPercent = undefined;
    } else if (type) {
      ctx.session.waitingForPercent = { code, type };
      await ctx.editMessageText(
        `Введите новое значение для ${type === 'buy' ? 'покупки' : 'продажи'} (например: 5 или 5%):\n\n` +
          'Или нажмите "Отмена"',
        Markup.inlineKeyboard([
          [Markup.button.callback('❌ Отмена', 'exchange_rates')],
        ]),
      );
    } else {
      const settings = await this.getCurrencyKeyboard(code);
      if (!settings) {
        await ctx.answerCbQuery('Валюта не найдена');
        return;
      }
      await ctx.editMessageText(settings.text, settings.keyboard);
    }
  }

  async getResourcesKeyboard(page: number = 1) {
    const { list: resources, total } =
      await this.exchangeDBService.getResources(page);
    const buttons = resources.map((resource) => [
      Markup.button.callback(
        `${resource.type === 'channel' ? '📢' : '💬'} | ${resource.name}`,
        `exchange_resource_view_${resource.Id}`,
      ),
    ]);

    const totalPages = Math.ceil(total / 10);
    const paginationButtons = [];

    if (totalPages > 1) {
      if (page > 1) {
        paginationButtons.push(
          Markup.button.callback('◀️', `exchange_resources_page_${page - 1}`),
        );
      }
      if (page < totalPages) {
        paginationButtons.push(
          Markup.button.callback('▶️', `exchange_resources_page_${page + 1}`),
        );
      }
    }

    buttons.push([
      Markup.button.callback('➕ Добавить канал/чат', 'exchange_add_resource'),
    ]);
    if (paginationButtons.length > 0) {
      buttons.push(paginationButtons);
    }
    buttons.push([Markup.button.callback('↩️ Назад', 'exchange')]);

    return Markup.inlineKeyboard(buttons);
  }

  async getResourceKeyboard(id: string) {
    const resource = await this.exchangeDBService.getResource(id);
    if (!resource) {
      return null;
    }

    const message =
      `⚙️ Настройки ${resource.type === 'channel' ? 'канала' : 'чата'}:` +
      `\n\nНазвание: ${resource.name}\n` +
      `Ссылка: ${resource.link}\n` +
      `Автопубликация: ${resource.auto_publish === 1 ? 'Включена' : 'Выключена'}`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          '📝 Шаблон сообщения',
          `exchange_resource_template_${id}`,
        ),
      ],
      [
        Markup.button.callback(
          resource.auto_publish === 1
            ? '🔕 Выключить автопубликацию'
            : '🔔 Включить автопубликацию',
          `exchange_resource_${resource.auto_publish === 1 ? 'disable-auto' : 'enable-auto'}_${id}`,
        ),
      ],
      [Markup.button.callback('🗑️ Удалить', `exchange_resource_delete_${id}`)],
      [Markup.button.callback('↩️ Назад', 'exchange_resources')],
    ]);

    return { text: message, keyboard };
  }

  async handleResourceAction(ctx: MyContext, action: string) {
    if (action === 'exchange_publish_rates') {
      await this.publishRates(ctx);
      return;
    }

    if (action === 'exchange_resources') {
      ctx.session.currentResourcesPage = 1;
      const keyboard = await this.getResourcesKeyboard();
      await ctx.editMessageText('Каналы и чаты для публикаций:', keyboard);
      return;
    }

    if (action.startsWith('exchange_resources_page_')) {
      const page = parseInt(action.split('_')[3]);
      ctx.session.currentResourcesPage = page;
      const keyboard = await this.getResourcesKeyboard(page);
      await ctx.editMessageText('Каналы и чаты для публикаций:', keyboard);
      return;
    }

    if (action === 'exchange_add_resource') {
      ctx.session.waitingForResource = true;
      await ctx.editMessageText(
        'Отправьте ссылку на канал или чат:',
        Markup.inlineKeyboard([
          [Markup.button.callback('↩️ Назад', 'exchange_resources')],
        ]),
      );
      return;
    }

    if (action.startsWith('exchange_resource_')) {
      const parts = action.split('_');
      const id = parts[3];
      const actionType = parts[2];

      if (actionType === 'view') {
        const settings = await this.getResourceKeyboard(id);
        if (settings) {
          await ctx.editMessageText(settings.text, settings.keyboard);
        } else {
          await ctx.answerCbQuery('⚠️ Ресурс не найден');
        }
        return;
      }

      if (actionType === 'delete') {
        const success = await this.exchangeDBService.deleteResource(id);
        if (success) {
          const currentPage = ctx.session.currentResourcesPage || 1;
          await ctx.editMessageText(
            'Канал/чат успешно удален',
            await this.getResourcesKeyboard(currentPage),
          );
        } else {
          await ctx.answerCbQuery('⚠️ Ошибка при удалении канала/чата');
        }
        return;
      }

      if (actionType === 'enable-auto' || actionType === 'disable-auto') {
        const resource = await this.exchangeDBService.updateResource(id, {
          auto_publish: actionType === 'enable-auto' ? 1 : 0,
        });
        if (resource) {
          const settings = await this.getResourceKeyboard(id);
          if (settings) {
            await ctx.editMessageText(settings.text, settings.keyboard);
          }
        } else {
          await ctx.answerCbQuery('⚠️ Ошибка при обновлении автопубликации');
        }
        return;
      }

      if (actionType === 'template') {
        const resource = await this.exchangeDBService.getResource(id);
        if (!resource) {
          await ctx.answerCbQuery('⚠️ Ресурс не найден');
          return;
        }

        const currentTemplate = resource.template;

        const variablesInfo = `{EUR.flag} - флаг валюты (например: 🇪🇺)
{EUR.currency} - код валюты (например: EUR)
{EUR.buy} - курс покупки
{EUR.sell} - курс продажи
{EUR.symbol} - символ валюты (например: €)`;

        const exampleUsage = `{EUR.flag}{EUR.currency}
Покупка: {EUR.buy} {EUR.symbol}
Продажа: {EUR.sell} {EUR.symbol}

{USD.flag}{USD.currency}
Покупка: {USD.buy} {USD.symbol}
Продажа: {USD.sell} {USD.symbol}`;

        await ctx.editMessageText(
          `📝 Шаблон сообщения для ${resource.name}\n\n` +
            `Текущий шаблон:\n\n\`\`\`\n${currentTemplate}\n\`\`\`\n\n` +
            `📝 Доступные переменные в шаблоне:\n\n\`\`\`\n${variablesInfo}\n\`\`\`\n\n` +
            `Пример использования:\n\n\`\`\`\n${exampleUsage}\n\`\`\`\n\n` +
            `Отправьте новый шаблон или нажмите "Назад"`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  '↩️ Назад',
                  `exchange_resource_view_${id}`,
                ),
              ],
            ]),
          },
        );

        ctx.session.waitingForTemplate = { resourceId: id };
        return;
      }
    }
  }

  async handleTextMessage(ctx: MyContext) {
    if (
      ctx.session.waitingForResource &&
      ctx.message &&
      'text' in ctx.message
    ) {
      let link = ctx.message.text.trim();
      try {
        // Обрабатываем разные форматы ссылок
        if (link.startsWith('https://t.me/')) {
          link = '@' + link.replace('https://t.me/', '');
        } else if (link.startsWith('http://t.me/')) {
          link = '@' + link.replace('http://t.me/', '');
        } else if (link.startsWith('t.me/')) {
          link = '@' + link.replace('t.me/', '');
        } else if (!link.startsWith('@')) {
          link = '@' + link;
        }

        const chat = await ctx.telegram.getChat(link);
        if (!chat) {
          await ctx.reply('⚠️ Не удалось получить информацию о канале/чате');
          return;
        }

        try {
          // Пробуем получить информацию о чате - это подтвердит, что бот является участником
          await ctx.telegram.getChatMember(chat.id, ctx.botInfo.id);
        } catch (error) {
          await ctx.reply('⚠️ Бот должен быть участником канала/чата');
          return;
        }

        const chatTitle = 'title' in chat ? chat.title : 'Unknown';
        const chatType = chat.type === 'channel' ? 'channel' : 'chat';

        const resource = await this.exchangeDBService.createResource({
          type: chatType,
          name: chatTitle,
          link: link,
          telegram_id: chat.id.toString(),
        });

        if (!resource) {
          await ctx.reply('⚠️ Ошибка при добавлении канала/чата');
          return;
        }

        const keyboard = await this.getResourcesKeyboard();
        await ctx.reply(`Канал/чат успешно добавлен:\n${chatTitle}`, keyboard);
      } catch (error) {
        console.error('Error adding resource:', error);
        await ctx.reply(
          '⚠️ Ошибка при добавлении канала/чата. Проверьте правильность ссылки и убедитесь, что бот добавлен в канал/чат.',
        );
      }
      ctx.session.waitingForResource = undefined;
      return;
    }

    if (
      ctx.session.waitingForTemplate &&
      ctx.message &&
      'text' in ctx.message
    ) {
      const { resourceId } = ctx.session.waitingForTemplate;
      const template = ctx.message.text.trim();

      const resource = await this.exchangeDBService.updateResource(resourceId, {
        template: template,
      });

      if (resource) {
        await ctx.reply('✅ Шаблон сообщения успешно обновлен');
        const settings = await this.getResourceKeyboard(resourceId);
        if (settings) {
          await ctx.reply(settings.text, settings.keyboard);
        }
      } else {
        await ctx.reply('⚠️ Ошибка при обновлении шаблона');
      }

      ctx.session.waitingForTemplate = undefined;
      return;
    }
  }

  async publishRates(ctx?: MyContext) {
    if (!this.bot) {
      throw new Error('Bot instance not set');
    }

    const currencies = await this.exchangeDBService.getCurrencies();
    const resources = await this.exchangeDBService.getResources(1, 100);

    let successCount = 0;
    let errorCount = 0;

    for (const resource of resources.list) {
      // Пропускаем ресурсы с выключенной автопубликацией
      if (resource.auto_publish === 0) continue;

      try {
        const template = resource.template;
        let message = template;

        // Заменяем переменные для каждой валюты
        currencies.forEach((currency) => {
          const code = currency.Code;
          message = message
            .replace(new RegExp(`{${code}\.flag}`, 'g'), currency.Flag)
            .replace(new RegExp(`{${code}\.currency}`, 'g'), currency.Code)
            .replace(new RegExp(`{${code}\.buy}`, 'g'), currency.Buy)
            .replace(new RegExp(`{${code}\.sell}`, 'g'), currency.Sell)
            .replace(new RegExp(`{${code}\.symbol}`, 'g'), currency.Symbol);
        });

        // Проверяем, является ли бот администратором
        const admins = await this.bot.telegram.getChatAdministrators(
          resource.telegram_id,
        );
        const isAdmin = admins.some(
          (admin) => admin.user.id === this.bot.botInfo.id,
        );

        const messageOptions = {
          parse_mode: 'HTML' as const,
          link_preview_options: { is_disabled: true },
          disable_notification: true,
        };

        if (isAdmin) {
          // Публикуем от имени канала/чата
          await this.bot.telegram.sendMessage(
            resource.telegram_id,
            message,
            messageOptions,
          );
        } else {
          // Публикуем от имени бота
          await this.bot.telegram.sendMessage(
            resource.telegram_id,
            message,
            messageOptions,
          );
        }

        successCount++;
      } catch (error) {
        console.error(`Error publishing rates to ${resource.name}:`, error);
        errorCount++;
      }
    }

    if (ctx) {
      await ctx.reply(
        `Публикация курсов завершена:\n✅ Успешно опубликовано: ${successCount}\n❌ Ошибок: ${errorCount}`,
        await this.getCurrenciesKeyboard(),
      );
    }

    return {
      successCount,
      errorCount,
    };
  }
}
