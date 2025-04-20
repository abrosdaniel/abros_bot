import { Markup } from 'telegraf';
import { NocoDBService } from '../database/nocodb.service';
import { TipTopService } from './clients/tiptop/tiptop.service';
export declare class AccountService {
    private readonly nocodbService;
    private readonly tiptopService;
    constructor(nocodbService: NocoDBService, tiptopService: TipTopService);
    private formatDate;
    private formatRoles;
    private formatSubscriptions;
    getAccountInfo(telegramId: string): Promise<string>;
    getAccountKeyboard(telegramId: string): Promise<Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>>;
    getEditKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
    updateUserData(telegramId: string, field: 'email' | 'phone', value: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private isValidEmail;
    private isValidPhone;
}
