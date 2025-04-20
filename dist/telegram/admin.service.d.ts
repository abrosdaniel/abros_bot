import { Markup } from 'telegraf';
import { NocoDBService } from '../database/nocodb.service';
export declare class AdminService {
    private readonly nocodbService;
    private readonly USERS_PER_PAGE;
    constructor(nocodbService: NocoDBService);
    private hasAdminRole;
    isAdmin(telegramId: string): Promise<boolean>;
    getAdminKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
    getUsersPage(page?: number): Promise<{
        users: any[];
        totalPages: number;
    }>;
    getUsersListKeyboard(page?: number): Promise<Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>>;
    getUserControlKeyboard(userId: string): Promise<Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>>;
    toggleUserBlock(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
