import { Markup, Telegraf } from 'telegraf';
import { NocoDBService } from '../../../database/nocodb.service';
import { ExchangeDBService } from '../../../database/services/exchange/exchange.service';
import { MyContext } from '../../types/context.types';
export declare class ExchangeService {
    private readonly nocodbService;
    private readonly exchangeDBService;
    private bot;
    constructor(nocodbService: NocoDBService, exchangeDBService: ExchangeDBService);
    setBotInstance(bot: Telegraf): void;
    isExchangeUser(telegramId: string): Promise<boolean>;
    getExchangeKeyboard(): Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>;
    getCurrenciesKeyboard(): Promise<Markup.Markup<import("@telegraf/types").InlineKeyboardMarkup>>;
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
