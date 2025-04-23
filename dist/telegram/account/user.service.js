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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
const nocodb_service_1 = require("../../database/nocodb.service");
const libphonenumber_js_1 = require("libphonenumber-js");
let UserService = class UserService {
    constructor(nocodbService) {
        this.nocodbService = nocodbService;
    }
    formatDate(dateString) {
        if (!dateString)
            return 'Не указана';
        const date = new Date(dateString);
        if (isNaN(date.getTime()))
            return 'Не указана';
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }
    formatRoles(roles) {
        if (!roles)
            return 'Нет ролей';
        if (typeof roles === 'string') {
            return roles || 'Нет ролей';
        }
        if (Array.isArray(roles)) {
            return roles.length > 0 ? roles.join('\n') : 'Нет ролей';
        }
        return 'Нет ролей';
    }
    formatSubscriptions(subscriptions) {
        if (!subscriptions)
            return 'Нет подписок';
        if (typeof subscriptions === 'string') {
            return subscriptions || 'Нет подписок';
        }
        if (Array.isArray(subscriptions)) {
            return subscriptions.length > 0
                ? subscriptions.join('\n')
                : 'Нет подписок';
        }
        return 'Нет подписок';
    }
    formatServices(services) {
        if (!services)
            return 'Нет сервисов';
        if (typeof services === 'string') {
            return services || 'Нет сервисов';
        }
        if (Array.isArray(services)) {
            return services.length > 0 ? services.join('\n') : 'Нет сервисов';
        }
        return 'Нет сервисов';
    }
    async getAccountInfo(telegramId) {
        const user = await this.nocodbService.findUser(telegramId);
        if (!user)
            return null;
        return `📱 Ваш профиль:

🆔
├ Системный: ${user.user_id}
└ Telegram: ${user.telegram_id}

👤 
├ Имя: ${user.first_name || 'Не указано'}
├ Фамилия: ${user.last_name || 'Не указана'}
├ Email: ${user.email || 'Не указан'}
└ Телефон: ${user.phone || 'Не указан'}

📅
└ Регистрация ${this.formatDate(user.CreatedAt)}

🔑 Роли:
${this.formatRoles(user.roles)}

🗂️ Подписки:
${this.formatSubscriptions(user.subscriptions)}

🛠️ Сервисы:
${this.formatServices(user.services)}`;
    }
    async getAccountKeyboard(telegramId) {
        const buttons = [
            [
                telegraf_1.Markup.button.callback('🗂️ Мои подписки', 'my_subscriptions'),
                telegraf_1.Markup.button.callback('🛠️ Мои сервисы', 'my_services'),
            ],
            [telegraf_1.Markup.button.callback('✏️ Редактировать профиль', 'edit_account')],
        ];
        buttons.push([telegraf_1.Markup.button.callback('↩️ Назад', 'back_to_main')]);
        return telegraf_1.Markup.inlineKeyboard(buttons);
    }
    async getServicesKeyboard(telegramId) {
        const user = await this.nocodbService.findUser(telegramId);
        const buttons = [];
        if (user?.services?.includes('Exchange')) {
            buttons.push([telegraf_1.Markup.button.callback(`💱 Обменник`, 'exchange')]);
        }
        buttons.push([telegraf_1.Markup.button.callback('↩️ Назад', 'back_to_profile')]);
        return telegraf_1.Markup.inlineKeyboard(buttons);
    }
    async getSubscriptionsKeyboard(telegramId) {
        const user = await this.nocodbService.findUser(telegramId);
        const buttons = [];
        if (user?.subscriptions && user.subscriptions.length > 0) {
            user.subscriptions.forEach((subscription) => {
                buttons.push([telegraf_1.Markup.button.callback(`📢 ${subscription}`, 'none')]);
            });
        }
        buttons.push([telegraf_1.Markup.button.callback('↩️ Назад', 'back_to_profile')]);
        return telegraf_1.Markup.inlineKeyboard(buttons);
    }
    getEditKeyboard() {
        return telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('📮 Email', 'edit_email')],
            [telegraf_1.Markup.button.callback('📞 Телефон', 'edit_phone')],
            [telegraf_1.Markup.button.callback('↩️ Назад', 'back_to_profile')],
        ]);
    }
    async updateUserData(telegramId, field, value) {
        try {
            if (field === 'email' && !this.isValidEmail(value)) {
                return {
                    success: false,
                    message: 'Неверный формат email. Пожалуйста, введите корректный email.',
                };
            }
            if (field === 'phone' && !this.isValidPhone(value)) {
                return {
                    success: false,
                    message: 'Неверный формат телефона. Пожалуйста, введите новый номер телефона в международном формате (например: +79001234567)',
                };
            }
            await this.nocodbService.updateUser(telegramId, { [field]: value });
            return {
                success: true,
                message: `${field === 'email' ? 'Email' : 'Телефон'} успешно обновлен.`,
            };
        }
        catch (error) {
            console.error('Error updating user data:', error);
            return {
                success: false,
                message: 'Произошла ошибка при обновлении данных. Пожалуйста, попробуйте позже.',
            };
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    isValidPhone(phone) {
        try {
            const phoneNumber = (0, libphonenumber_js_1.parsePhoneNumberFromString)(phone);
            return phoneNumber?.isValid() || false;
        }
        catch (error) {
            return false;
        }
    }
    async isDeveloperUser(telegramId) {
        const user = await this.nocodbService.findUser(telegramId);
        if (!user?.roles)
            return false;
        return user.roles.includes('Developer');
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nocodb_service_1.NocoDBService])
], UserService);
//# sourceMappingURL=user.service.js.map