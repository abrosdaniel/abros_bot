import { NocoDBService } from '../database/nocodb.service';
import { UserService } from './account/user.service';
import { AdminService } from './account/admin.service';
import { ExchangeService } from './services/exchange/exchange.service';
import { MyContext } from './types/context.types';
import { Telegraf } from 'telegraf';
export declare class TelegramUpdate {
    private bot;
    private readonly nocodbService;
    private readonly accountService;
    private readonly adminService;
    private readonly exchangeService;
    private editingStates;
    constructor(bot: Telegraf<MyContext>, nocodbService: NocoDBService, accountService: UserService, adminService: AdminService, exchangeService: ExchangeService);
    getBot(): Telegraf<MyContext>;
    private updateUserIfNeeded;
    private getMainKeyboard;
    start(ctx: any): Promise<void>;
    onCallbackQuery(ctx: any): Promise<void>;
    onText(ctx: MyContext): Promise<void>;
    onPhoto(ctx: MyContext): Promise<void>;
    onVideo(ctx: MyContext): Promise<void>;
    onDocument(ctx: MyContext): Promise<void>;
}
