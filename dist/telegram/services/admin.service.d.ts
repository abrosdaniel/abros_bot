import { Markup } from 'telegraf';
import { BroadcastService } from './broadcast.service';
export declare class AdminService {
    private readonly broadcastService;
    constructor(broadcastService: BroadcastService);
    getAdminKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
    getBroadcastKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
    handleBroadcastAction(ctx: any, action: string): Promise<void>;
    handleBroadcastMessage(ctx: any): Promise<void>;
}
