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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const appwrite_service_1 = require("../appwrite/appwrite.service");
let TelegramService = class TelegramService {
    constructor(bot, appwriteService) {
        this.bot = bot;
        this.appwriteService = appwriteService;
        this.userStates = new Map();
        this.orderQuestions = [
            'Название проекта:',
            'Опишите ваши требования и пожелания:',
            'Какой у вас ориентировочный бюджет?',
            'Какие сроки реализации вас интересуют?',
            'Как с вами связаться по мимо телеграмма? (email/телефон/вк/дискорд)',
        ];
        this.setupCommands();
    }
    async setupCommands() {
        try {
            await this.bot.telegram.setMyCommands([{ command: 'menu', description: 'Показать главное меню' }], { scope: { type: 'all_private_chats' } });
        }
        catch (error) {
            console.error('Ошибка при установке команд бота:', error);
        }
    }
    async sendMainMenu(ctx, deleteMessage = false) {
        const inlineKeyboard = {
            inline_keyboard: [
                [],
                [
                    {
                        text: '💼 Портфолио',
                        switch_inline_query_current_chat: 'portfolio',
                    },
                    { text: '💰 Донат', url: process.env.MONEY_DONATE_LINK },
                ],
                [{ text: '💬 Связь', callback_data: 'contact' }],
            ],
        };
        const message = `👋🏻 Привет, ${ctx.message?.from.first_name || ctx.callbackQuery?.from.first_name}!

В этом боте собрано много функционала и он постоянно пополняется новыми возможностями.

Здесь ты можешь заказать разработку сайта, предложить свою идею, получить помощь и многое другое.
 
Давай начнем! 🚀

📃 [Privacy policy](${process.env.PRIVACY_POLICY_LINK})`;
        if (deleteMessage && ctx.callbackQuery?.message) {
            try {
                await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
                await ctx.reply(message, {
                    parse_mode: 'Markdown',
                    reply_markup: inlineKeyboard,
                    disable_web_page_preview: true,
                });
            }
            catch (error) {
                console.error('Error deleting message:', error);
                await ctx.editMessageText(message, {
                    parse_mode: 'Markdown',
                    reply_markup: inlineKeyboard,
                    disable_web_page_preview: true,
                });
            }
        }
        else if ('message' in ctx) {
            await ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: inlineKeyboard,
                disable_web_page_preview: true,
            });
        }
        else if ('callback_query' in ctx) {
            await ctx.editMessageText(message, {
                parse_mode: 'Markdown',
                reply_markup: inlineKeyboard,
                disable_web_page_preview: true,
            });
        }
    }
    async sendAccountMenu(ctx, userData) {
        const keyboard = {
            inline_keyboard: [
                [
                    { text: 'Редактировать', callback_data: 'edit_account' },
                    { text: 'Сессии', callback_data: 'sessions' },
                ],
                [{ text: 'Выйти', callback_data: 'logout' }],
                [{ text: '« Назад', callback_data: 'main_menu' }],
            ],
        };
        const message = `
ID: ${userData.id}
Имя: ${userData.name}
Подписки: ${userData.subscriptions || 'Нет'}
    `;
        if ('callback_query' in ctx) {
            await ctx.editMessageText(message, { reply_markup: keyboard });
        }
    }
    async sendContactMenu(ctx) {
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '💼 Заказать', callback_data: 'order' },
                    { text: '🫂 Поддержка', callback_data: 'support' },
                ],
                [{ text: '« Назад', callback_data: 'main_menu' }],
            ],
        };
        if (ctx.callbackQuery) {
            await ctx.editMessageText('💬 Не стесняйся, пиши нам в любое время! А мы постараемся ответить как можно быстрее!', {
                reply_markup: keyboard,
            });
        }
        else {
            await ctx.reply('💬 Не стесняйся, пиши нам в любое время! А мы постараемся ответить как можно быстрее!', { reply_markup: keyboard });
        }
    }
    async sendEditAccountMenu(ctx, userData) {
        const keyboard = {
            inline_keyboard: [
                [{ text: 'Изменить имя', callback_data: 'edit_name' }],
                [{ text: 'Изменить почту', callback_data: 'edit_email' }],
                [{ text: '« Назад', callback_data: 'account' }],
            ],
        };
        if ('callback_query' in ctx) {
            await ctx.editMessageText('Выберите, что хотите изменить:', {
                reply_markup: keyboard,
            });
        }
    }
    async sendPortfolioItem(ctx, itemId) {
        const item = await this.appwriteService.getPortfolioItem(itemId);
        if (!item)
            return;
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        };
        const startDate = formatDate(item.date_start);
        const endDate = item.date_end
            ? formatDate(item.date_end)
            : 'настоящее время';
        await ctx.telegram.sendPhoto(ctx.message.chat.id, item.pic ? this.appwriteService.getImageUrl(item.pic) : null, {
            caption: `
${item.name}

📝 ${item.text}

📅 Ведение: ${startDate} - ${endDate}

🧰 Стек: ${item.tags}
`,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '👀 Посмотреть', url: item.link }],
                    [
                        {
                            text: '💻 Показать портфолио',
                            switch_inline_query_current_chat: 'portfolio',
                        },
                    ],
                    [{ text: '🏠 Главное меню', callback_data: 'main_menu' }],
                ],
            },
        });
        try {
            await ctx.deleteMessage();
        }
        catch (error) {
            console.error('Error deleting message:', error);
        }
    }
    async deleteMessage(chatId, messageId) {
        try {
            await this.bot.telegram.deleteMessage(chatId, messageId);
        }
        catch (error) {
            console.error('Error deleting message:', error);
        }
    }
    async startOrder(ctx) {
        const userId = ctx.callbackQuery.from.id;
        this.userStates.set(userId, {
            state: 'order',
            data: {
                answers: [],
                currentQuestion: 0,
                username: ctx.callbackQuery.from.username,
                firstName: ctx.callbackQuery.from.first_name,
                lastName: ctx.callbackQuery.from.last_name,
            },
        });
        await ctx.editMessageText(this.orderQuestions[0], {
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Отменить', callback_data: 'contact' }]],
            },
        });
    }
    async handleOrderMessage(ctx) {
        const userId = ctx.message.from.id;
        const userState = this.userStates.get(userId);
        if (!userState || userState.state !== 'order')
            return false;
        userState.data.answers.push(ctx.message.text);
        if (userState.data.currentQuestion < this.orderQuestions.length - 1) {
            userState.data.currentQuestion++;
            await ctx.reply(this.orderQuestions[userState.data.currentQuestion], {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '❌ Отменить', callback_data: 'contact' }],
                    ],
                },
            });
        }
        else {
            const adminMessage = `
📋 Новый заказ!

👤 ${userState.data.firstName || ''} ${userState.data.lastName || ''} ${userState.data.username ? '@' + userState.data.username : ''}

❓ Название проекта:
${userState.data.answers[0]}

📝 Требования:
${userState.data.answers[1]}

💰 Ориентировочный бюджет:
${userState.data.answers[2]}

⏰ Сроки:
${userState.data.answers[3]}

📞 Контакт:
${userState.data.answers[4]}
`;
            await this.bot.telegram.sendMessage(process.env.TELEGRAM_ADMIN_PEER_ID, adminMessage);
            await ctx.reply('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }],
                    ],
                },
            });
            this.userStates.delete(userId);
        }
        return true;
    }
    async startSupport(ctx) {
        const userId = ctx.callbackQuery.from.id;
        this.userStates.set(userId, {
            state: 'support',
            data: {
                username: ctx.callbackQuery.from.username,
                firstName: ctx.callbackQuery.from.first_name,
                lastName: ctx.callbackQuery.from.last_name,
            },
        });
        await ctx.editMessageText('Напишите нам свой вопрос, а мы постараемся ответить как можно быстрее!', {
            reply_markup: {
                inline_keyboard: [[{ text: '🚪 Выйти', callback_data: 'contact' }]],
            },
        });
    }
    async handleSupportMessage(ctx) {
        const userId = ctx.message.from.id;
        const userState = this.userStates.get(userId);
        if (!userState || userState.state !== 'support')
            return false;
        const supportChatId = process.env.TELEGRAM_SUPPORT_PEER_ID;
        if (!supportChatId) {
            console.error('TELEGRAM_SUPPORT_PEER_ID не установлен в .env файле');
            await ctx.reply('Извините, произошла ошибка. Попробуйте позже.', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }],
                    ],
                },
            });
            return true;
        }
        try {
            await this.bot.telegram.sendMessage(supportChatId, `👤 От: ${userState.data.firstName || ''} ${userState.data.lastName || ''} ${userState.data.username ? '@' + userState.data.username : ''}
ID: ${userId}

${ctx.message.text}

Статус: ⏳ Ожидает ответа`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '❌ Закрыть тикет',
                                callback_data: `close_ticket:${userId}`,
                            },
                        ],
                    ],
                },
            });
            await ctx.reply('Ваше сообщение отправлено в поддержку. Ожидайте ответа.');
        }
        catch (error) {
            console.error('Ошибка отправки сообщения в чат поддержки:', error);
            console.error('ID чата поддержки:', supportChatId);
            await ctx.reply('Извините, произошла ошибка. Попробуйте позже.', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }],
                    ],
                },
            });
        }
        return true;
    }
    async sendSupportReply(userId, message, replyToMessageId, originalMessageText) {
        try {
            await this.bot.telegram.sendMessage(userId, `📮 Ответ поддержки:\n\n${message}`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '↩️ Ответить', callback_data: 'reply_support' },
                            {
                                text: '❌ Закрыть тикет',
                                callback_data: 'close_ticket_user',
                            },
                        ],
                    ],
                },
            });
            const supportChatId = process.env.TELEGRAM_SUPPORT_PEER_ID;
            await this.bot.telegram.editMessageText(supportChatId, replyToMessageId, undefined, `${originalMessageText.replace(/\nСтатус: .*$/, '')}\n\nСтатус: ✅ Ответили`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '❌ Закрыть тикет',
                                callback_data: `close_ticket:${userId}`,
                            },
                        ],
                    ],
                },
            });
        }
        catch (error) {
            console.error('Ошибка отправки ответа пользователю:', error);
            const supportChatId = process.env.TELEGRAM_SUPPORT_PEER_ID;
            await this.bot.telegram.editMessageText(supportChatId, replyToMessageId, undefined, `${originalMessageText.replace(/\nСтатус: .*$/, '')}\n\nСтатус: ❌ Ошибка отправки\n${error.message}`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '❌ Закрыть тикет',
                                callback_data: `close_ticket:${userId}`,
                            },
                        ],
                    ],
                },
            });
        }
    }
    async sendMessage(chatId, text) {
        return this.bot.telegram.sendMessage(chatId, text);
    }
    async handleTicketClose(messageId, userId, messageText) {
        try {
            const supportChatId = process.env.TELEGRAM_SUPPORT_PEER_ID;
            await this.bot.telegram.editMessageText(supportChatId, messageId, undefined, `${messageText.replace(/\nСтатус: .*$/, '')}\n\nСтатус: 🔒 Закрыт`, {
                reply_markup: {
                    inline_keyboard: [],
                },
            });
        }
        catch (error) {
            console.error('Ошибка при закрытии тикета:', error);
        }
    }
    setUserState(userId, state, data) {
        this.userStates.set(userId, { state, data });
    }
    getUserState(userId) {
        return this.userStates.get(userId);
    }
    clearUserState(userId) {
        this.userStates.delete(userId);
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [telegraf_1.Telegraf,
        appwrite_service_1.AppwriteService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map