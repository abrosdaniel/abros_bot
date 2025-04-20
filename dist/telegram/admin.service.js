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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
const nocodb_service_1 = require("../database/nocodb.service");
let AdminService = class AdminService {
    constructor(nocodbService) {
        this.nocodbService = nocodbService;
        this.USERS_PER_PAGE = 5;
    }
    hasAdminRole(roles) {
        return roles?.includes('Admin') || false;
    }
    async isAdmin(telegramId) {
        const user = await this.nocodbService.findUser(telegramId);
        return this.hasAdminRole(user?.roles);
    }
    getAdminKeyboard() {
        return telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('👥 Управление пользователями', 'admin_users')],
            [telegraf_1.Markup.button.callback('📢 Отправить новость', 'admin_send_news')],
            [telegraf_1.Markup.button.callback('↩️ Назад', 'back_to_main')],
        ]);
    }
    async getUsersPage(page = 1) {
        const allUsers = await this.nocodbService.getAllUsers();
        const totalPages = Math.ceil(allUsers.length / this.USERS_PER_PAGE);
        const startIndex = (page - 1) * this.USERS_PER_PAGE;
        const endIndex = startIndex + this.USERS_PER_PAGE;
        const users = allUsers.slice(startIndex, endIndex);
        return { users, totalPages };
    }
    async getUsersListKeyboard(page = 1) {
        const { users, totalPages } = await this.getUsersPage(page);
        const buttons = users.map((user) => [
            telegraf_1.Markup.button.callback(`${user.user_id} | ${user.first_name || 'Без имени'} ${user.last_name || ''}`, `admin_user_${user.user_id}`),
        ]);
        const paginationButtons = [];
        if (page > 1) {
            paginationButtons.push(telegraf_1.Markup.button.callback('◀️', `admin_users_page_${page - 1}`));
        }
        paginationButtons.push(telegraf_1.Markup.button.callback(`${page}/${totalPages}`, 'admin_users_current_page'));
        if (page < totalPages) {
            paginationButtons.push(telegraf_1.Markup.button.callback('▶️', `admin_users_page_${page + 1}`));
        }
        buttons.push(paginationButtons);
        buttons.push([telegraf_1.Markup.button.callback('↩️ Назад', 'back_to_admin')]);
        return telegraf_1.Markup.inlineKeyboard(buttons);
    }
    async getUserControlKeyboard(userId) {
        const user = await this.nocodbService.findUserById(userId);
        return telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback(user.block === 1 ? '✅ Разблокировать' : '❌ Заблокировать', `admin_toggle_block_${userId}`),
            ],
            [telegraf_1.Markup.button.callback('↩️ Назад', 'admin_users')],
        ]);
    }
    async toggleUserBlock(userId) {
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
        }
        catch (error) {
            console.error('Error toggling user block:', error);
            return {
                success: false,
                message: 'Ошибка при изменении статуса блокировки',
            };
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nocodb_service_1.NocoDBService])
], AdminService);
//# sourceMappingURL=admin.service.js.map