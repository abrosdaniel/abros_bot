import { Account, Databases } from 'node-appwrite';
export declare class AppwriteService {
    private client;
    private account;
    private databases;
    private storage;
    constructor();
    getAccount(): Account;
    getDatabases(): Databases;
    getUserData(ctx: any): Promise<import("node-appwrite").Models.Document>;
    getPortfolioItems(): Promise<import("node-appwrite").Models.Document[]>;
    getPortfolioItem(itemId: string): Promise<import("node-appwrite").Models.Document>;
    getImageUrl(fileId: string): string;
}
