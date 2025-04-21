import { Markup } from 'telegraf';
import { NocoDBService } from '../../database/nocodb.service';
export declare class UserService {
    private readonly nocodbService;
    constructor(nocodbService: NocoDBService);
    private formatDate;
    private formatRoles;
    private formatSubscriptions;
    private formatServices;
    getAccountInfo(telegramId: string): Promise<string>;
    getAccountKeyboard(telegramId: string): Promise<Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>>;
    getServicesKeyboard(telegramId: string): Promise<Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>>;
    getSubscriptionsKeyboard(telegramId: string): Promise<Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>>;
    getEditKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
    updateUserData(telegramId: string, field: 'email' | 'phone', value: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private isValidEmail;
    private isValidPhone;
}
