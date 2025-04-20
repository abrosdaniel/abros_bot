export declare class NocoDBService {
    private readonly baseUrl;
    private readonly apiKey;
    constructor();
    private generateUserId;
    private isUserIdExists;
    private generateUniqueUserId;
    findUser(telegramId: string): Promise<any>;
    createUser(userData: {
        telegram_id: string;
        telegram_username?: string;
        first_name?: string;
        last_name?: string;
    }): Promise<any>;
    findUserById(userId: string): Promise<any>;
    updateUser(telegramId: string, userData: {
        telegram_username?: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        block?: number;
    }): Promise<any>;
    isUserBlocked(telegramId: string): Promise<boolean>;
    getAllUsers(): Promise<any>;
}
