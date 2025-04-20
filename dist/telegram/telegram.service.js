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
const nocodb_service_1 = require("../database/nocodb.service");
const telegraf_1 = require("telegraf");
const account_service_1 = require("./account.service");
const admin_service_1 = require("./admin.service");
const tiptop_service_1 = require("./clients/tiptop/tiptop.service");
let TelegramService = class TelegramService {
    constructor(nocodbService, accountService, adminService, tiptopService) {
        this.nocodbService = nocodbService;
        this.accountService = accountService;
        this.adminService = adminService;
        this.tiptopService = tiptopService;
        this.editingStates = new Map();
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
            [
                telegraf_1.Markup.button.callback('👤 Аккаунт', 'account'),
                telegraf_1.Markup.button.callback('💼 Портфолио', 'portfolio'),
            ],
            [
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
        await ctx.reply(`👋🏻 Привет, ${user.first_name}!\n\nВ этом боте собрано много функционала и он постоянно пополняется новыми возможностями.\n\nДавай начнем! 🚀`, await this.getMainKeyboard(telegramId));
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
        if (action === 'tiptop') {
            const isTipTopUser = await this.tiptopService.isTipTopUser(telegramId);
            if (!isTipTopUser) {
                await ctx.answerCbQuery('⚠️ У вас нет доступа к TipTop');
                return;
            }
            await ctx.editMessageText('Главное меню сервиса TipTop', this.tiptopService.getTipTopKeyboard());
            return;
        }
        if (action === 'tiptop_exchange') {
            const isTipTopUser = await this.tiptopService.isTipTopUser(telegramId);
            if (!isTipTopUser) {
                await ctx.answerCbQuery('⚠️ У вас нет доступа к TipTop');
                return;
            }
            await ctx.editMessageText('💱 Курсы валют:', await this.tiptopService.getExchangeKeyboard());
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
        if (action.startsWith('tiptop_currency_buy_percent_') ||
            action.startsWith('tiptop_currency_sell_percent_')) {
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
        if (action === 'tiptop_resources' ||
            action.startsWith('tiptop_resource_') ||
            action.startsWith('tiptop_resources_page_') ||
            action === 'tiptop_add_resource') {
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
                await ctx.editMessageText(accountInfo, await this.accountService.getAccountKeyboard(telegramId));
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
            await ctx.editMessageText(`👤 Пользователь: ${user.first_name || 'Без имени'} ${user.last_name || ''}\n` +
                `🆔 Системный: ${user.user_id}\n` +
                `🆔 Telegram: ${user.telegram_id}\n` +
                `🏷 Username: ${user.telegram_username}\n` +
                `📮 Почта: ${user.email}\n` +
                `📞 Телефон: ${user.phone}\n` +
                `Статус: ${user.block === 1 ? '🚫 Заблокирован' : '🟢 Активен'}`, await this.adminService.getUserControlKeyboard(userId));
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
                await ctx.editMessageText(`👤 Пользователь: ${user.first_name || 'Без имени'} ${user.last_name || ''}\n` +
                    `🆔 Системный: ${user.user_id}\n` +
                    `🆔 Telegram: ${user.telegram_id}\n` +
                    `🏷 Username: ${user.telegram_username}\n` +
                    `📮 Почта: ${user.email}\n` +
                    `📞 Телефон: ${user.phone}\n` +
                    `Статус: ${user.block === 1 ? '🚫 Заблокирован' : '🟢 Активен'}`, await this.adminService.getUserControlKeyboard(userId));
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
                await ctx.editMessageText('📞 Введите новый номер телефона в формате +XXXXXXXXXXX:', telegraf_1.Markup.inlineKeyboard([
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
            await this.tiptopService.handleCurrencyAction(ctx, `tiptop_currency_${ctx.session.waitingForPercent.type}_percent_${ctx.session.waitingForPercent.code}`);
            return;
        }
        await this.tiptopService.handleTextMessage(ctx);
    }
    async onPhoto(ctx) {
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
    async onVideo(ctx) {
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
    async onDocument(ctx) {
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
    async sendNewsToAllUsers(ctx, media) {
        const users = await this.nocodbService.getAllUsers();
        let successCount = 0;
        let errorCount = 0;
        for (const user of users) {
            try {
                if (user.block === 1)
                    continue;
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
            }
            catch (error) {
                console.error(`Error sending news to user ${user.telegram_id}:`, error);
                errorCount++;
            }
        }
        await ctx.reply(`Рассылка завершена:\n✅ Успешно отправлено: ${successCount}\n❌ Ошибок: ${errorCount}`, this.adminService.getAdminKeyboard());
    }
};
exports.TelegramService = TelegramService;
__decorate([
    (0, nestjs_telegraf_1.Start)(),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramService.prototype, "start", null);
__decorate([
    (0, nestjs_telegraf_1.On)('callback_query'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramService.prototype, "onCallbackQuery", null);
__decorate([
    (0, nestjs_telegraf_1.On)('text'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramService.prototype, "onText", null);
__decorate([
    (0, nestjs_telegraf_1.On)('photo'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramService.prototype, "onPhoto", null);
__decorate([
    (0, nestjs_telegraf_1.On)('video'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramService.prototype, "onVideo", null);
__decorate([
    (0, nestjs_telegraf_1.On)('document'),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramService.prototype, "onDocument", null);
exports.TelegramService = TelegramService = __decorate([
    (0, nestjs_telegraf_1.Update)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nocodb_service_1.NocoDBService,
        account_service_1.AccountService,
        admin_service_1.AdminService,
        tiptop_service_1.TipTopService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map