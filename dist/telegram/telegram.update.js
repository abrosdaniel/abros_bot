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
exports.TelegramUpdate = void 0;
const common_1 = require("@nestjs/common");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegram_service_1 = require("./telegram.service");
const user_service_1 = require("../user/user.service");
const appwrite_service_1 = require("../appwrite/appwrite.service");
let TelegramUpdate = class TelegramUpdate {
    constructor(telegramService, userService, appwriteService) {
        this.telegramService = telegramService;
        this.userService = userService;
        this.appwriteService = appwriteService;
    }
    async onStart(ctx) {
        await this.telegramService.sendMainMenu(ctx);
    }
    async onMenuCommand(ctx) {
        if (ctx.chat?.type !== 'private') {
            return;
        }
        await this.telegramService.sendMainMenu(ctx);
    }
    async onAccount(ctx) {
        const userData = await this.appwriteService.getUserData(ctx);
        if (userData) {
            await this.telegramService.sendAccountMenu(ctx, userData);
        }
        else {
            await ctx.editMessageText('Пожалуйста, введите вашу почту:', {
                reply_markup: {
                    inline_keyboard: [[{ text: '« Назад', callback_data: 'main_menu' }]],
                },
            });
        }
    }
    async onContact(ctx) {
        await this.telegramService.sendContactMenu(ctx);
    }
    async onEditAccount(ctx) {
        const userData = await this.appwriteService.getUserData(ctx);
        if (userData) {
            await this.telegramService.sendEditAccountMenu(ctx, userData);
        }
    }
    async onSessions(ctx) {
        if (!ctx.callbackQuery)
            return;
        await ctx.editMessageText('Функция в разработке', {
            reply_markup: {
                inline_keyboard: [[{ text: '« Назад', callback_data: 'account' }]],
            },
        });
    }
    async onOrder(ctx) {
        await this.telegramService.startOrder(ctx);
    }
    async onSupport(ctx) {
        await this.telegramService.startSupport(ctx);
    }
    async onMainMenu(ctx) {
        await this.telegramService.sendMainMenu(ctx, true);
    }
    async onInlineQuery(ctx) {
        if (!ctx.inlineQuery)
            return;
        if (!ctx.inlineQuery.query) {
            const commands = [
                {
                    type: 'article',
                    id: 'inline_commands',
                    title: '⌘ Команды',
                    description: `💻 Просмотр портфолио - введите "portfolio"`,
                    input_message_content: {
                        message_text: `
⌘ Список команд:

💻 Просмотр портфолио - введите "portfolio"
            `,
                    },
                },
            ];
            await ctx.answerInlineQuery(commands, { cache_time: 0 });
            return;
        }
        if (ctx.inlineQuery.query === 'portfolio') {
            const items = await this.appwriteService.getPortfolioItems();
            items.sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());
            const isPrivateChat = ctx.inlineQuery.chat_type === 'sender';
            const results = await Promise.all(items.map(async (item) => {
                const baseResult = {
                    id: item.$id,
                    type: 'article',
                    title: item.name,
                    description: `📝 ${item.desc}\n\n🧰 Стек: ${item.tags}`,
                    thumb_url: item.logo
                        ? this.appwriteService.getImageUrl(item.logo)
                        : null,
                };
                if (isPrivateChat) {
                    return {
                        ...baseResult,
                        input_message_content: {
                            message_text: `/abros-portfolio-${item.$id}`,
                        },
                    };
                }
                else {
                    const photoUrl = this.appwriteService.getImageUrl(item.pic);
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
                    return {
                        ...baseResult,
                        input_message_content: {
                            message_text: `<a href="${photoUrl}">&#8205;</a>${item.name}\n\n📝 ${item.text}\n\n📅 Ведение: ${startDate} - ${endDate}\n\n🧰 Стек: ${item.tags}`,
                            parse_mode: 'HTML',
                        },
                        reply_markup: {
                            inline_keyboard: [[{ text: '👀 Посмотреть', url: item.link }]],
                        },
                    };
                }
            }));
            await ctx.answerInlineQuery(results, { cache_time: 0 });
        }
    }
    async onMessage(ctx) {
        if (!ctx.message?.text)
            return;
        if (ctx.message.reply_to_message &&
            ctx.message.chat.id.toString() === process.env.TELEGRAM_SUPPORT_PEER_ID) {
            const match = ctx.message.reply_to_message.text.match(/ID: (\d+)/);
            if (match) {
                const userId = match[1];
                await this.telegramService.sendSupportReply(parseInt(userId), ctx.message.text, ctx.message.reply_to_message.message_id, ctx.message.reply_to_message.text);
                return;
            }
        }
        const portfolioMatch = ctx.message.text.match(/^\/abros-portfolio-(.+)$/);
        if (portfolioMatch) {
            const itemId = portfolioMatch[1];
            await this.telegramService.sendPortfolioItem(ctx, itemId);
            return;
        }
        if (await this.telegramService.handleOrderMessage(ctx))
            return;
        if (await this.telegramService.handleSupportMessage(ctx))
            return;
    }
    async onReplySupport(ctx) {
        const userId = ctx.callbackQuery.from.id;
        const originalMessage = ctx.callbackQuery.message.text;
        this.telegramService.setUserState(userId, 'support', {
            username: ctx.callbackQuery.from.username,
            firstName: ctx.callbackQuery.from.first_name,
            lastName: ctx.callbackQuery.from.last_name,
            originalMessage: originalMessage,
        });
        await ctx.editMessageText('Введите ваш ответ:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '❌ Отменить', callback_data: 'exit_reply_support' }],
                ],
            },
        });
    }
    async onExitReplySupport(ctx) {
        const userId = ctx.callbackQuery.from.id;
        const userState = await this.telegramService.getUserState(userId);
        if (userState?.data?.originalMessage) {
            await ctx.editMessageText(userState.data.originalMessage, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '↩️ Ответить', callback_data: 'reply_support' },
                            { text: '❌ Закрыть тикет', callback_data: 'close_ticket_user' },
                        ],
                    ],
                },
            });
        }
        this.telegramService.clearUserState(userId);
    }
    async onCloseTicketUser(ctx) {
        const messageText = ctx.callbackQuery.message.text;
        await ctx.editMessageText(`${messageText}\n\nСтатус: 🔒 Закрыт`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🏠 Главное меню', callback_data: 'main_menu' }],
                ],
            },
        });
    }
    async onCloseTicketSupport(ctx) {
        if (!ctx.callbackQuery?.data)
            return;
        const userId = ctx.callbackQuery.data.split(':')[1];
        const messageId = ctx.callbackQuery.message.message_id;
        const messageText = ctx.callbackQuery.message.text;
        await this.telegramService.handleTicketClose(messageId, parseInt(userId), messageText);
    }
};
exports.TelegramUpdate = TelegramUpdate;
__decorate([
    (0, nestjs_telegraf_1.Start)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onStart", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('menu'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onMenuCommand", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('account'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onAccount", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('contact'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onContact", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('edit_account'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onEditAccount", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('sessions'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onSessions", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('order'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onOrder", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('support'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onSupport", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('main_menu'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onMainMenu", null);
__decorate([
    (0, nestjs_telegraf_1.On)('inline_query'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onInlineQuery", null);
__decorate([
    (0, nestjs_telegraf_1.On)('message'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onMessage", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('reply_support'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onReplySupport", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('exit_reply_support'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onExitReplySupport", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('close_ticket_user'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onCloseTicketUser", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/^close_ticket:(\d+)$/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onCloseTicketSupport", null);
exports.TelegramUpdate = TelegramUpdate = __decorate([
    (0, nestjs_telegraf_1.Update)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [telegram_service_1.TelegramService,
        user_service_1.UserService,
        appwrite_service_1.AppwriteService])
], TelegramUpdate);
//# sourceMappingURL=telegram.update.js.map