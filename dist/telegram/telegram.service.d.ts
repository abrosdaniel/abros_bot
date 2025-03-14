import { Telegraf } from 'telegraf';
import { AppwriteService } from '../appwrite/appwrite.service';
export declare class TelegramService {
    private bot;
    private appwriteService;
    constructor(bot: Telegraf, appwriteService: AppwriteService);
    private setupCommands;
    private userStates;
    private readonly orderQuestions;
    sendMainMenu(ctx: any, deleteMessage?: boolean): Promise<void>;
    sendAccountMenu(ctx: any, userData: any): Promise<void>;
    sendContactMenu(ctx: any): Promise<void>;
    sendEditAccountMenu(ctx: any, userData: any): Promise<void>;
    sendPortfolioItem(ctx: any, itemId: string): Promise<void>;
    deleteMessage(chatId: number, messageId: number): Promise<void>;
    startOrder(ctx: any): Promise<void>;
    handleOrderMessage(ctx: any): Promise<boolean>;
    startSupport(ctx: any): Promise<void>;
    handleSupportMessage(ctx: any): Promise<boolean>;
    sendSupportReply(userId: number, message: string, replyToMessageId: number, originalMessageText: string): Promise<void>;
    sendMessage(chatId: number, text: string): Promise<import("@telegraf/types").Message.TextMessage>;
    handleTicketClose(messageId: number, userId: number, messageText: string): Promise<void>;
    setUserState(userId: number, state: string, data: any): void;
    getUserState(userId: number): {
        state: string;
        data: any;
    };
    clearUserState(userId: number): void;
}
