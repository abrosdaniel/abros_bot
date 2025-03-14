import { AppwriteService } from '../appwrite/appwrite.service';
export declare class UserService {
    private readonly appwriteService;
    constructor(appwriteService: AppwriteService);
    findByTelegramId(telegramId: string): Promise<any>;
    createUser(userData: {
        email: string;
        password: string;
        name: string;
        telegramId: string;
    }): Promise<any>;
    updateUser(userId: string, updateData: any): Promise<any>;
}
