import { Markup } from 'telegraf';
import { NocoDBService } from '../../database/nocodb.service';
import { MyContext } from '../types/context.types';
interface NewsMedia {
    type: 'photo' | 'video' | 'document';
    file_id: string;
    caption: string;
}
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
    sendNewsToAllUsers(ctx: MyContext, media: NewsMedia): Promise<{
        successCount: number;
        errorCount: number;
    }>;
    private formatNewsCaption;
    getNewsKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
}
export {};
