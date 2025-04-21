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
const nocodb_service_1 = require("../database/nocodb.service");
const telegraf_1 = require("telegraf");
const user_service_1 = require("./account/user.service");
const admin_service_1 = require("./account/admin.service");
const exchange_service_1 = require("./services/exchange/exchange.service");
const telegraf_2 = require("telegraf");
let TelegramUpdate = class TelegramUpdate {
    constructor(bot, nocodbService, accountService, adminService, exchangeService) {
        this.bot = bot;
        this.nocodbService = nocodbService;
        this.accountService = accountService;
        this.adminService = adminService;
        this.exchangeService = exchangeService;
        this.editingStates = new Map();
        this.exchangeService.setBotInstance(this.bot);
    }
    getBot() {
        return this.bot;
    }
    async updateUserIfNeeded(telegramId, username, firstName, lastName) {
        const user = await this.nocodbService.findUser(telegramId);
        if (user) {
            const needsUpdate = user.telegram_username !== username ||
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
    async getMainKeyboard(telegramId) {
        const isAdmin = await this.adminService.isAdmin(telegramId);
        const buttons = [
            [telegraf_1.Markup.button.callback('👤 Аккаунт', 'account')],
            [
                telegraf_1.Markup.button.callback('💼 Портфолио', 'portfolio'),
                telegraf_1.Markup.button.callback('💬 Связь', 'contact'),
                telegraf_1.Markup.button.callback('💸 Донат', 'donate'),
            ],
        ];
        if (isAdmin) {
            buttons.push([telegraf_1.Markup.button.callback('🔐 Админка', 'admin')]);
        }
        return telegraf_1.Markup.inlineKeyboard(buttons);
    }
    async start(ctx) {
        const telegramId = ctx.from.id.toString();
        const username = ctx.from.username;
        const firstName = ctx.from.first_name;
        const lastName = ctx.from.last_name;
        const isBlocked = await this.nocodbService.isUserBlocked(telegramId);
        if (isBlocked) {
            await ctx.reply('⚠️ Доступ к боту заблокирован. Пожалуйста, свяжитесь с @et0daniel для разблокировки.');
            return;
        }
        let user = await this.updateUserIfNeeded(telegramId, username, firstName, lastName);
        if (!user) {
            user = await this.nocodbService.createUser({
                telegram_id: telegramId,
                telegram_username: username,
                first_name: firstName,
                last_name: lastName,
            });
        }
        await ctx.reply(`👋🏻 Привет, ${user.first_name}!\n\n` +
            `В этом боте собрано много функционала и он постоянно пополняется новыми возможностями.\n\n` +
            `Давай начнем! 🚀`, await this.getMainKeyboard(telegramId));
    }
    async onCallbackQuery(ctx) {
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
            const isExchangeUser = await this.exchangeService.isExchangeUser(telegramId);
            if (!isExchangeUser) {
                await ctx.answerCbQuery('⚠️ У вас нет доступа к Обменнику');
                return;
            }
            await ctx.editMessageText('Главное меню сервиса Обменник', this.exchangeService.getExchangeKeyboard());
            return;
        }
        if (action === 'exchange_rates') {
            const isExchangeUser = await this.exchangeService.isExchangeUser(telegramId);
            if (!isExchangeUser) {
                await ctx.answerCbQuery('⚠️ У вас нет доступа к Обменнику');
                return;
            }
            await ctx.editMessageText('💱 Курсы валют:', await this.exchangeService.getCurrenciesKeyboard());
            return;
        }
        if (action === 'exchange_publish_rates') {
            const isExchangeUser = await this.exchangeService.isExchangeUser(telegramId);
            if (!isExchangeUser) {
                await ctx.answerCbQuery('⚠️ У вас нет доступа к Обменнику');
                return;
            }
            await this.exchangeService.handleResourceAction(ctx, action);
            return;
        }
        if (action.startsWith('exchange_currency_buy_percent_') ||
            action.startsWith('exchange_currency_sell_percent_')) {
            const isExchangeUser = await this.exchangeService.isExchangeUser(telegramId);
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
        if (action === 'exchange_resources' ||
            action.startsWith('exchange_resource_') ||
            action.startsWith('exchange_resources_page_') ||
            action === 'exchange_add_resource') {
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
                await ctx.editMessageText(accountInfo, await this.accountService.getAccountKeyboard(telegramId));
            }
            return;
        }
        if (action === 'back_to_services') {
            await ctx.editMessageText('🛠️ Ваши сервисы:', await this.accountService.getServicesKeyboard(telegramId));
            return;
        }
        if (action.startsWith('admin_users_page_')) {
            const isAdmin = await this.adminService.isAdmin(telegramId);
            if (!isAdmin) {
                await ctx.answerCbQuery('⚠️ У вас нет доступа к админ-панели');
                return;
            }
            const page = parseInt(action.split('_')[3]);
            await ctx.editMessageText('👥 Список пользователей:', await this.adminService.getUsersListKeyboard(page));
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
            await ctx.editMessageText(`🆔 Системный: ${user.user_id} | Telegram: ${user.telegram_id}

🏷 Username: ${user.telegram_username}
👤 Пользователь: ${user.first_name || 'Без имени'} ${user.last_name || ''}
📮 Почта: ${user.email}
📞 Телефон: ${user.phone}

Статус: ${user.block === 1 ? '🚫 Заблокирован' : '🟢 Активен'}`, await this.adminService.getUserControlKeyboard(userId));
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
                await ctx.editMessageText(`🆔 Системный: ${user.user_id} | Telegram: ${user.telegram_id}

🏷 Username: ${user.telegram_username}
👤 Пользователь: ${user.first_name || 'Без имени'} ${user.last_name || ''}
📮 Почта: ${user.email}
📞 Телефон: ${user.phone}

Статус: ${user.block === 1 ? '🚫 Заблокирован' : '🟢 Активен'}`, await this.adminService.getUserControlKeyboard(userId));
            }
            return;
        }
        if (action === 'admin_send_news') {
            if (!(await this.adminService.isAdmin(telegramId))) {
                await ctx.answerCbQuery('У вас нет доступа к админке');
                return;
            }
            ctx.session.waitingForNews = true;
            await ctx.editMessageText('Отправьте медиа-сообщение (фото, видео, документ) с текстом для рассылки:', telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('↩️ Назад', 'back_to_admin')],
            ]));
            return;
        }
        switch (action) {
            case 'admin': {
                const isAdmin = await this.adminService.isAdmin(telegramId);
                if (!isAdmin) {
                    await ctx.answerCbQuery('⚠️ У вас нет доступа к админ-панели');
                    return;
                }
                await ctx.editMessageText('🔐 Админ-панель', this.adminService.getAdminKeyboard());
                break;
            }
            case 'admin_users': {
                const isAdmin = await this.adminService.isAdmin(telegramId);
                if (!isAdmin) {
                    await ctx.answerCbQuery('⚠️ У вас нет доступа к админ-панели');
                    return;
                }
                await ctx.editMessageText('👥Список пользователей:', await this.adminService.getUsersListKeyboard());
                break;
            }
            case 'back_to_admin': {
                const isAdmin = await this.adminService.isAdmin(telegramId);
                if (!isAdmin) {
                    await ctx.answerCbQuery('⚠️ У вас нет доступа к админ-панели');
                    return;
                }
                await ctx.editMessageText('🔐 Админ-панель', this.adminService.getAdminKeyboard());
                break;
            }
            case 'account': {
                const accountInfo = await this.accountService.getAccountInfo(telegramId);
                if (accountInfo) {
                    await ctx.editMessageText(accountInfo, await this.accountService.getAccountKeyboard(telegramId));
                }
                break;
            }
            case 'edit_account': {
                await ctx.editMessageText('✏️ Выберите данные для редактирования:', this.accountService.getEditKeyboard());
                break;
            }
            case 'edit_email': {
                this.editingStates.set(ctx.from.id, { field: 'email' });
                await ctx.editMessageText('📮 Введите новый email:', telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('❌ Отмена', 'back_to_profile')],
                ]));
                break;
            }
            case 'edit_phone': {
                this.editingStates.set(ctx.from.id, { field: 'phone' });
                await ctx.editMessageText('📞 Введите новый номер телефона в международном формате (например: +79001234567):\n\n' +
                    'Или нажмите "Отмена"', telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('❌ Отмена', 'back_to_profile')],
                ]));
                break;
            }
            case 'back_to_profile': {
                const accountInfo = await this.accountService.getAccountInfo(telegramId);
                if (accountInfo) {
                    await ctx.editMessageText(accountInfo, await this.accountService.getAccountKeyboard(telegramId));
                }
                this.editingStates.delete(ctx.from.id);
                break;
            }
            case 'back_to_main': {
                const user = await this.nocodbService.findUser(telegramId);
                await ctx.editMessageText(`👋🏻 Привет, ${user.first_name}!
      
В этом боте собрано много функционала и он постоянно пополняется новыми возможностями.
      
Давай начнем! 🚀`, await this.getMainKeyboard(telegramId));
                break;
            }
            case 'portfolio':
                await ctx.editMessageText('В разработке...', await this.getMainKeyboard(telegramId));
                break;
            case 'contact':
                await ctx.editMessageText('В разработке...', await this.getMainKeyboard(telegramId));
                break;
            case 'donate':
                await ctx.editMessageText('В разработке...', await this.getMainKeyboard(telegramId));
                break;
            case 'my_services': {
                await ctx.editMessageText('🛠️ Ваши сервисы:', await this.accountService.getServicesKeyboard(telegramId));
                break;
            }
            case 'my_subscriptions': {
                await ctx.editMessageText('🗂️ Ваши подписки:', await this.accountService.getSubscriptionsKeyboard(telegramId));
                break;
            }
            case 'exchange': {
                const isExchangeUser = await this.exchangeService.isExchangeUser(telegramId);
                if (!isExchangeUser) {
                    await ctx.answerCbQuery('⚠️ У вас нет доступа к Обменнику');
                    return;
                }
                await ctx.editMessageText('Главное меню сервиса Обменник', this.exchangeService.getExchangeKeyboard());
                break;
            }
        }
        await ctx.answerCbQuery();
    }
    async onText(ctx) {
        const telegramId = ctx.from.id.toString();
        const isBlocked = await this.nocodbService.isUserBlocked(telegramId);
        if (isBlocked) {
            await ctx.reply('⚠️ Доступ к боту заблокирован');
            return;
        }
        if (ctx.session.waitingForPercent) {
            await this.exchangeService.handleCurrencyAction(ctx, `exchange_currency_${ctx.session.waitingForPercent.type}_percent_${ctx.session.waitingForPercent.code}`);
            return;
        }
        const editingState = this.editingStates.get(ctx.from.id);
        if (editingState && ctx.message && 'text' in ctx.message) {
            const input = ctx.message.text.trim();
            const result = await this.accountService.updateUserData(telegramId, editingState.field, input);
            if (result.success) {
                await ctx.reply(result.message);
                const accountInfo = await this.accountService.getAccountInfo(telegramId);
                if (accountInfo) {
                    await ctx.reply(accountInfo, await this.accountService.getAccountKeyboard(telegramId));
                }
            }
            else {
                await ctx.reply(result.message + '\n\nПопробуйте еще раз или нажмите "Отмена"', telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('❌ Отмена', 'back_to_profile')],
                ]));
                return;
            }
            this.editingStates.delete(ctx.from.id);
            return;
        }
        await this.exchangeService.handleTextMessage(ctx);
    }
    async onPhoto(ctx) {
        if (ctx.session.waitingForNews && 'photo' in ctx.message) {
            const photo = ctx.message.photo[ctx.message.photo.length - 1];
            const caption = 'caption' in ctx.message ? ctx.message.caption || '' : '';
            const { successCount, errorCount } = await this.adminService.sendNewsToAllUsers(ctx, {
                type: 'photo',
                file_id: photo.file_id,
                caption,
            });
            await ctx.reply(`Рассылка завершена:\n✅ Успешно отправлено: ${successCount}\n❌ Ошибок: ${errorCount}`, this.adminService.getAdminKeyboard());
            ctx.session.waitingForNews = undefined;
        }
    }
    async onVideo(ctx) {
        if (ctx.session.waitingForNews && 'video' in ctx.message) {
            const video = ctx.message.video;
            const caption = 'caption' in ctx.message ? ctx.message.caption || '' : '';
            const { successCount, errorCount } = await this.adminService.sendNewsToAllUsers(ctx, {
                type: 'video',
                file_id: video.file_id,
                caption,
            });
            await ctx.reply(`Рассылка завершена:\n✅ Успешно отправлено: ${successCount}\n❌ Ошибок: ${errorCount}`, this.adminService.getAdminKeyboard());
            ctx.session.waitingForNews = undefined;
        }
    }
    async onDocument(ctx) {
        if (ctx.session.waitingForNews && 'document' in ctx.message) {
            const document = ctx.message.document;
            const caption = 'caption' in ctx.message ? ctx.message.caption || '' : '';
            const { successCount, errorCount } = await this.adminService.sendNewsToAllUsers(ctx, {
                type: 'document',
                file_id: document.file_id,
                caption,
            });
            await ctx.reply(`Рассылка завершена:\n✅ Успешно отправлено: ${successCount}\n❌ Ошибок: ${errorCount}`, this.adminService.getAdminKeyboard());
            ctx.session.waitingForNews = undefined;
        }
    }
};
exports.TelegramUpdate = TelegramUpdate;
__decorate([
    (0, nestjs_telegraf_1.Start)(),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "start", null);
__decorate([
    (0, nestjs_telegraf_1.On)('callback_query'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onCallbackQuery", null);
__decorate([
    (0, nestjs_telegraf_1.On)('text'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onText", null);
__decorate([
    (0, nestjs_telegraf_1.On)('photo'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onPhoto", null);
__decorate([
    (0, nestjs_telegraf_1.On)('video'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onVideo", null);
__decorate([
    (0, nestjs_telegraf_1.On)('document'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramUpdate.prototype, "onDocument", null);
exports.TelegramUpdate = TelegramUpdate = __decorate([
    (0, nestjs_telegraf_1.Update)(),
    (0, common_1.Injectable)(),
    __param(0, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [telegraf_2.Telegraf,
        nocodb_service_1.NocoDBService,
        user_service_1.UserService,
        admin_service_1.AdminService,
        exchange_service_1.ExchangeService])
], TelegramUpdate);
//# sourceMappingURL=telegram.update.js.map