import { Context } from 'telegraf';
import { Update as TelegrafUpdate } from 'telegraf/types';
import { TelegramService } from './telegram.service';
import { UserService } from '../user/user.service';
import { AppwriteService } from '../appwrite/appwrite.service';
type TelegrafContext = Context<TelegrafUpdate>;
export declare class TelegramUpdate {
    private readonly telegramService;
    private readonly userService;
    private readonly appwriteService;
    constructor(telegramService: TelegramService, userService: UserService, appwriteService: AppwriteService);
    onStart(ctx: TelegrafContext): Promise<void>;
    onMenuCommand(ctx: TelegrafContext): Promise<void>;
    onAccount(ctx: any): Promise<void>;
    onContact(ctx: any): Promise<void>;
    onEditAccount(ctx: any): Promise<void>;
    onSessions(ctx: TelegrafContext): Promise<void>;
    onOrder(ctx: TelegrafContext): Promise<void>;
    onSupport(ctx: TelegrafContext): Promise<void>;
    onMainMenu(ctx: any): Promise<void>;
    onInlineQuery(ctx: any): Promise<void>;
    onMessage(ctx: any): Promise<void>;
    onReplySupport(ctx: any): Promise<void>;
    onExitReplySupport(ctx: any): Promise<void>;
    onCloseTicketUser(ctx: any): Promise<void>;
    onCloseTicketSupport(ctx: any): Promise<void>;
}
export {};
