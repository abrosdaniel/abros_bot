import { Markup } from 'telegraf';
import { NocoDBService } from '../../../database/nocodb.service';
import { TipTopDBService } from '../../../database/clients/tiptop/tiptop-db.service';
import { MyContext } from '../../types/context.types';
export declare class TipTopService {
    private readonly nocodbService;
    private readonly tiptopDBService;
    constructor(nocodbService: NocoDBService, tiptopDBService: TipTopDBService);
    private hasTipTopRole;
    isTipTopUser(telegramId: string): Promise<boolean>;
    getTipTopKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
    getExchangeKeyboard(): Promise<Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>>;
    getCurrencyKeyboard(code: string): Promise<{
        text: string;
        keyboard: Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
    }>;
    handleCurrencyAction(ctx: MyContext, action: string): Promise<void>;
    getResourcesKeyboard(page?: number): Promise<Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>>;
    getResourceKeyboard(id: string): Promise<{
        text: string;
        keyboard: Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
    }>;
    handleResourceAction(ctx: MyContext, action: string): Promise<void>;
    handleTextMessage(ctx: MyContext): Promise<void>;
    publishRates(ctx?: MyContext): Promise<{
        successCount: number;
        errorCount: number;
    }>;
}
