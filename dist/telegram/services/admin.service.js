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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
const broadcast_service_1 = require("./broadcast.service");
let AdminService = class AdminService {
    constructor(broadcastService) {
        this.broadcastService = broadcastService;
    }
    getAdminKeyboard() {
        return telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('📢 Рассылка', 'admin_broadcast')],
            [telegraf_1.Markup.button.callback('↩️ Назад', 'back_to_account')],
        ]);
    }
    getBroadcastKeyboard() {
        return telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('📝 Текст', 'admin_broadcast_text')],
            [telegraf_1.Markup.button.callback('🖼️ Фото', 'admin_broadcast_photo')],
            [telegraf_1.Markup.button.callback('🎥 Видео', 'admin_broadcast_video')],
            [telegraf_1.Markup.button.callback('📄 Документ', 'admin_broadcast_document')],
            [telegraf_1.Markup.button.callback('↩️ Назад', 'admin')],
        ]);
    }
    async handleBroadcastAction(ctx, action) {
        if (action === 'admin_broadcast') {
            await ctx.editMessageText('Выберите тип рассылки:', this.getBroadcastKeyboard());
            return;
        }
        if (action.startsWith('admin_broadcast_')) {
            const type = action.split('_')[2];
            ctx.session.broadcastType = type;
            ctx.session.waitingForBroadcast = true;
            let message = 'Отправьте ';
            switch (type) {
                case 'text':
                    message += 'текст сообщения:';
                    break;
                case 'photo':
                    message += 'фото с подписью:';
                    break;
                case 'video':
                    message += 'видео с подписью:';
                    break;
                case 'document':
                    message += 'документ с подписью:';
                    break;
            }
            await ctx.editMessageText(message, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('↩️ Назад', 'admin_broadcast')],
            ]));
            return;
        }
    }
    async handleBroadcastMessage(ctx) {
        if (!ctx.session.waitingForBroadcast || !ctx.session.broadcastType) {
            return;
        }
        const type = ctx.session.broadcastType;
        let media = null;
        let message = '';
        if (type === 'text') {
            if (!ctx.message || !('text' in ctx.message)) {
                await ctx.reply('Пожалуйста, отправьте текстовое сообщение');
                return;
            }
            message = ctx.message.text;
        }
        else {
            if (!ctx.message) {
                await ctx.reply('Пожалуйста, отправьте медиафайл');
                return;
            }
            if (type === 'photo' && 'photo' in ctx.message) {
                const photo = ctx.message.photo[ctx.message.photo.length - 1];
                media = {
                    type: 'photo',
                    file_id: photo.file_id,
                };
            }
            else if (type === 'video' && 'video' in ctx.message) {
                media = {
                    type: 'video',
                    file_id: ctx.message.video.file_id,
                };
            }
            else if (type === 'document' && 'document' in ctx.message) {
                media = {
                    type: 'document',
                    file_id: ctx.message.document.file_id,
                };
            }
            else {
                await ctx.reply(`Пожалуйста, отправьте ${type === 'photo' ? 'фото' : type === 'video' ? 'видео' : 'документ'}`);
                return;
            }
            if ('caption' in ctx.message) {
                message = ctx.message.caption || '';
            }
        }
        try {
            const result = await this.broadcastService.sendBroadcast(ctx, message, media);
            await ctx.reply(`Рассылка завершена:\n` +
                `✅ Успешно: ${result.success}\n` +
                `❌ Ошибок: ${result.failed}\n` +
                `📊 Всего: ${result.total}`, this.getAdminKeyboard());
        }
        catch (error) {
            console.error('Error in broadcast:', error);
            await ctx.reply('⚠️ Ошибка при отправке рассылки', this.getAdminKeyboard());
        }
        ctx.session.waitingForBroadcast = false;
        ctx.session.broadcastType = undefined;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof broadcast_service_1.BroadcastService !== "undefined" && broadcast_service_1.BroadcastService) === "function" ? _a : Object])
], AdminService);
//# sourceMappingURL=admin.service.js.map