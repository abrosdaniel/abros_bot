"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
const nocodb_service_1 = require("../../../database/nocodb.service");
const exchange_service_1 = require("../../../database/services/exchange/exchange.service");
let ExchangeService = class ExchangeService {
    constructor(nocodbService, exchangeDBService) {
        this.nocodbService = nocodbService;
        this.exchangeDBService = exchangeDBService;
    }
    setBotInstance(bot) {
        this.bot = bot;
    }
    getBot() {
        return this.bot;
    }
    async isExchangeUser(telegramId) {
        const user = await this.nocodbService.findUser(telegramId);
        return user?.services?.includes('Exchange') || false;
    }
    getExchangeKeyboard() {
        return telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('💱 Курсы', 'exchange_rates')],
            [
                telegraf_1.Markup.button.callback('💬 Каналы/Чаты для публикаций', 'exchange_resources'),
            ],
            [telegraf_1.Markup.button.callback('↩️ Назад', 'back_to_services')],
        ]);
    }
    async getCurrenciesKeyboard() {
        const currencies = await this.exchangeDBService.getCurrencies();
        const buttons = currencies.map((currency) => [
            telegraf_1.Markup.button.callback(`${currency.Flag}${currency.Code}`, 'none'),
            telegraf_1.Markup.button.callback(`${currency.Buy} ${currency.Symbol}`, 'none'),
            telegraf_1.Markup.button.callback(`${currency.Sell} ${currency.Symbol}`, 'none'),
            telegraf_1.Markup.button.callback(`✏️`, `exchange_currency_${currency.Code}`),
        ]);
        buttons.push([
            telegraf_1.Markup.button.callback('📢 Опубликовать', 'exchange_publish_rates'),
            telegraf_1.Markup.button.callback('↩️ Назад', 'exchange'),
        ]);
        return telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('Валюта', 'none'),
                telegraf_1.Markup.button.callback('Покупка', 'none'),
                telegraf_1.Markup.button.callback('Продажа', 'none'),
                telegraf_1.Markup.button.callback('⚙️', 'none'),
            ],
            ...buttons,
        ]);
    }
    async getCurrencyKeyboard(code) {
        const currency = await this.exchangeDBService.getCurrency(code);
        if (!currency) {
            return null;
        }
        const message = `⚙️ Настройки валюты ${currency.Flag}${currency.Code}\n\n` +
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
            keyboard: telegraf_1.Markup.inlineKeyboard([
                [
                    telegraf_1.Markup.button.callback('Изменить % Покупки', `exchange_currency_buy_percent_${currency.Code}`),
                    telegraf_1.Markup.button.callback('Изменить % Продажи', `exchange_currency_sell_percent_${currency.Code}`),
                ],
                [telegraf_1.Markup.button.callback('↩️ Назад', 'exchange_rates')],
            ]),
        };
    }
    async handleCurrencyAction(ctx, action) {
        let code;
        let type = null;
        if (action.startsWith('exchange_currency_buy_percent_')) {
            code = action.replace('exchange_currency_buy_percent_', '');
            type = 'buy';
        }
        else if (action.startsWith('exchange_currency_sell_percent_')) {
            code = action.replace('exchange_currency_sell_percent_', '');
            type = 'sell';
        }
        else {
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
                await ctx.reply('❌ Неверный формат. Введите положительное число или процент (например: 5 или 5%)\n\n' +
                    'Или нажмите "Отмена"', telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('❌ Отмена', 'exchange_rates')],
                ]));
                return;
            }
            const updatedCurrency = await this.exchangeDBService.updateCurrencyValue(code, value, isPercentage, type);
            if (!updatedCurrency) {
                await ctx.reply('❌ Ошибка при обновлении значения\n\n' +
                    'Попробуйте еще раз или нажмите "Отмена"', telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('❌ Отмена', 'exchange_rates')],
                ]));
                return;
            }
            await ctx.reply(`✅ Значение ${type === 'buy' ? 'покупки' : 'продажи'} успешно обновлено до ${input}\n` +
                `Новые цены:\n` +
                `Покупка: ${updatedCurrency.Buy} ${updatedCurrency.Symbol}\n` +
                `Продажа: ${updatedCurrency.Sell} ${updatedCurrency.Symbol}`, await this.getCurrenciesKeyboard());
            ctx.session.waitingForPercent = undefined;
        }
        else if (type) {
            ctx.session.waitingForPercent = { code, type };
            await ctx.editMessageText(`Введите новое значение для ${type === 'buy' ? 'покупки' : 'продажи'} (например: 5 или 5%):\n\n` +
                'Или нажмите "Отмена"', telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('❌ Отмена', 'exchange_rates')],
            ]));
        }
        else {
            const settings = await this.getCurrencyKeyboard(code);
            if (!settings) {
                await ctx.answerCbQuery('Валюта не найдена');
                return;
            }
            await ctx.editMessageText(settings.text, settings.keyboard);
        }
    }
    async getResourcesKeyboard(page = 1) {
        const { list: resources, total } = await this.exchangeDBService.getResources(page);
        const buttons = resources.map((resource) => [
            telegraf_1.Markup.button.callback(`${resource.type === 'channel' ? '📢' : '💬'} | ${resource.name}`, `exchange_resource_view_${resource.Id}`),
        ]);
        const totalPages = Math.ceil(total / 10);
        const paginationButtons = [];
        if (totalPages > 1) {
            if (page > 1) {
                paginationButtons.push(telegraf_1.Markup.button.callback('◀️', `exchange_resources_page_${page - 1}`));
            }
            if (page < totalPages) {
                paginationButtons.push(telegraf_1.Markup.button.callback('▶️', `exchange_resources_page_${page + 1}`));
            }
        }
        buttons.push([
            telegraf_1.Markup.button.callback('➕ Добавить канал/чат', 'exchange_add_resource'),
        ]);
        if (paginationButtons.length > 0) {
            buttons.push(paginationButtons);
        }
        buttons.push([telegraf_1.Markup.button.callback('↩️ Назад', 'exchange')]);
        return telegraf_1.Markup.inlineKeyboard(buttons);
    }
    async getResourceKeyboard(id) {
        const resource = await this.exchangeDBService.getResource(id);
        if (!resource) {
            return null;
        }
        const message = `⚙️ Настройки ${resource.type === 'channel' ? 'канала' : 'чата'}:` +
            `\n\nНазвание: ${resource.name}\n` +
            `Ссылка: ${resource.link}\n` +
            `Автопубликация: ${resource.auto_publish === 1 ? 'Включена' : 'Выключена'}`;
        const keyboard = telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('📝 Шаблон сообщения', `exchange_resource_template_${id}`),
            ],
            [
                telegraf_1.Markup.button.callback(resource.auto_publish === 1
                    ? '🔕 Выключить автопубликацию'
                    : '🔔 Включить автопубликацию', `exchange_resource_${resource.auto_publish === 1 ? 'disable-auto' : 'enable-auto'}_${id}`),
            ],
            [telegraf_1.Markup.button.callback('🗑️ Удалить', `exchange_resource_delete_${id}`)],
            [telegraf_1.Markup.button.callback('↩️ Назад', 'exchange_resources')],
        ]);
        return { text: message, keyboard };
    }
    async handleResourceAction(ctx, action) {
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
            await ctx.editMessageText('Отправьте ссылку на канал или чат:', telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('↩️ Назад', 'exchange_resources')],
            ]));
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
                }
                else {
                    await ctx.answerCbQuery('⚠️ Ресурс не найден');
                }
                return;
            }
            if (actionType === 'delete') {
                const success = await this.exchangeDBService.deleteResource(id);
                if (success) {
                    const currentPage = ctx.session.currentResourcesPage || 1;
                    await ctx.editMessageText('Канал/чат успешно удален', await this.getResourcesKeyboard(currentPage));
                }
                else {
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
                }
                else {
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
                const variablesInfo = `{EUR.name} - название валюты (например: Евро)
{EUR.code} - код валюты (например: EUR)
{EUR.flag} - флаг валюты (например: 🇪🇺)
{EUR.buy} - курс покупки
{EUR.sell} - курс продажи
{EUR.symbol} - символ валюты (например: €)`;
                const formattingInfo = `<b>жирный текст</b> - &lt;b&gt;текст&lt;/b&gt;
<i>курсив</i> - &lt;i&gt;текст&lt;/i&gt;
<u>подчеркнутый</u> - &lt;u&gt;текст&lt;/u&gt;
<s>зачеркнутый</s> - &lt;s&gt;текст&lt;/s&gt;
<code>моноширинный</code> - &lt;code&gt;текст&lt;/code&gt;
блок цитаты как этот - &lt;blockquote&gt;текст&lt;/blockquote&gt;
<a href="https://t.me/et0daniel">ссылка текстом</a> - &lt;a href="url"&gt;текст&lt;/a&gt;`;
                await ctx.editMessageText(`<b>📝 Шаблон сообщения для ${resource.name}</b>\n\n` +
                    `<b>Текущее сообщение:</b>\n<blockquote>${currentTemplate}</blockquote>\n\n` +
                    `<b>Доступные переменные:</b>\n<blockquote>${variablesInfo}</blockquote>\n\n` +
                    `<b>Доступные виды форматирования:</b>\n<blockquote>${formattingInfo}</blockquote>\n\n` +
                    `Отправьте новый шаблон или нажмите "Назад"`, {
                    parse_mode: 'HTML',
                    link_preview_options: { is_disabled: true },
                    ...telegraf_1.Markup.inlineKeyboard([
                        [
                            telegraf_1.Markup.button.callback('↩️ Назад', `exchange_resource_view_${id}`),
                        ],
                    ]),
                });
                ctx.session.waitingForTemplate = { resourceId: id };
                return;
            }
        }
    }
    async handleTextMessage(ctx) {
        if (ctx.session.waitingForResource &&
            ctx.message &&
            'text' in ctx.message) {
            let link = ctx.message.text.trim();
            try {
                if (link.startsWith('https://t.me/')) {
                    link = '@' + link.replace('https://t.me/', '');
                }
                else if (link.startsWith('http://t.me/')) {
                    link = '@' + link.replace('http://t.me/', '');
                }
                else if (link.startsWith('t.me/')) {
                    link = '@' + link.replace('t.me/', '');
                }
                else if (!link.startsWith('@')) {
                    link = '@' + link;
                }
                const chat = await ctx.telegram.getChat(link);
                if (!chat) {
                    await ctx.reply('⚠️ Не удалось получить информацию о канале/чате');
                    return;
                }
                try {
                    await ctx.telegram.getChatMember(chat.id, ctx.botInfo.id);
                }
                catch (error) {
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
            }
            catch (error) {
                console.error('Error adding resource:', error);
                await ctx.reply('⚠️ Ошибка при добавлении канала/чата. Проверьте правильность ссылки и убедитесь, что бот добавлен в канал/чат.');
            }
            ctx.session.waitingForResource = undefined;
            return;
        }
        if (ctx.session.waitingForTemplate &&
            ctx.message &&
            'text' in ctx.message) {
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
            }
            else {
                await ctx.reply('⚠️ Ошибка при обновлении шаблона');
            }
            ctx.session.waitingForTemplate = undefined;
            return;
        }
    }
    async publishRates(ctx) {
        if (!this.bot) {
            throw new Error('Bot instance not set');
        }
        const currencies = await this.exchangeDBService.getCurrencies();
        const resources = await this.exchangeDBService.getResources(1, 100);
        let successCount = 0;
        let errorCount = 0;
        for (const resource of resources.list) {
            if (resource.auto_publish === 0)
                continue;
            try {
                const template = resource.template;
                let message = template;
                currencies.forEach((currency) => {
                    const code = currency.Code;
                    message = message
                        .replace(new RegExp(`{${code}\.name}`, 'g'), currency.Name)
                        .replace(new RegExp(`{${code}\.code}`, 'g'), currency.Code)
                        .replace(new RegExp(`{${code}\.flag}`, 'g'), currency.Flag)
                        .replace(new RegExp(`{${code}\.buy}`, 'g'), currency.Buy)
                        .replace(new RegExp(`{${code}\.sell}`, 'g'), currency.Sell)
                        .replace(new RegExp(`{${code}\.symbol}`, 'g'), currency.Symbol);
                });
                const messageOptions = {
                    parse_mode: 'HTML',
                    link_preview_options: { is_disabled: true },
                    disable_notification: true,
                };
                await this.bot.telegram.sendMessage(resource.telegram_id, message, messageOptions);
                successCount++;
            }
            catch (error) {
                console.error(`Error publishing rates to ${resource.name}:`, error);
                errorCount++;
            }
        }
        if (ctx) {
            await ctx.reply(`Публикация курсов завершена:\n✅ Успешно опубликовано: ${successCount}\n❌ Ошибок: ${errorCount}`, await this.getCurrenciesKeyboard());
        }
        return {
            successCount,
            errorCount,
        };
    }
};
exports.ExchangeService = ExchangeService;
exports.ExchangeService = ExchangeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nocodb_service_1.NocoDBService,
        exchange_service_1.ExchangeDBService])
], ExchangeService);
//# sourceMappingURL=exchange.service.js.map