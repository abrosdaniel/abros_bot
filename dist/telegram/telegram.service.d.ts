import { NocoDBService } from '../database/nocodb.service';
import { AccountService } from './account.service';
import { AdminService } from './admin.service';
import { TipTopService } from './clients/tiptop/tiptop.service';
import { MyContext } from './types/context.types';
export declare class TelegramService {
    private readonly nocodbService;
    private readonly accountService;
    private readonly adminService;
    private readonly tiptopService;
    private editingStates;
    constructor(nocodbService: NocoDBService, accountService: AccountService, adminService: AdminService, tiptopService: TipTopService);
    private updateUserIfNeeded;
    private getMainKeyboard;
    start(ctx: any): Promise<void>;
    onCallbackQuery(ctx: any): Promise<void>;
    onText(ctx: MyContext): Promise<void>;
    onPhoto(ctx: MyContext): Promise<void>;
    onVideo(ctx: MyContext): Promise<void>;
    onDocument(ctx: MyContext): Promise<void>;
    private sendNewsToAllUsers;
}
