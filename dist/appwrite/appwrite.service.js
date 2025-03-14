"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppwriteService = void 0;
const common_1 = require("@nestjs/common");
const node_appwrite_1 = require("node-appwrite");
let AppwriteService = class AppwriteService {
    constructor() {
        this.client = new node_appwrite_1.Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT)
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);
        this.account = new node_appwrite_1.Account(this.client);
        this.databases = new node_appwrite_1.Databases(this.client);
        this.storage = new node_appwrite_1.Storage(this.client);
    }
    getAccount() {
        return this.account;
    }
    getDatabases() {
        return this.databases;
    }
    async getUserData(ctx) {
        if (!ctx.callbackQuery)
            return null;
        const telegramId = ctx.callbackQuery.from.id.toString();
        try {
            const user = await this.databases.listDocuments(process.env.APPWRITE_GENERAL_DATABASE_ID, 'users', [`filter=telegramId=${telegramId}`]);
            return user.documents[0];
        }
        catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }
    async getPortfolioItems() {
        try {
            const items = await this.databases.listDocuments(process.env.APPWRITE_GENERAL_DATABASE_ID, 'portfolio');
            return items.documents;
        }
        catch (error) {
            console.error('Error fetching portfolio items:', error);
            return [];
        }
    }
    async getPortfolioItem(itemId) {
        try {
            const item = await this.databases.getDocument(process.env.APPWRITE_GENERAL_DATABASE_ID, 'portfolio', itemId);
            return item;
        }
        catch (error) {
            console.error('Error fetching portfolio item:', error);
            return null;
        }
    }
    getImageUrl(fileId) {
        const bucketId = process.env.APPWRITE_BUCKET_ID;
        if (!bucketId) {
            console.error('APPWRITE_BUCKET_ID not set in environment variables');
            return '';
        }
        const endpoint = process.env.APPWRITE_ENDPOINT;
        const projectId = process.env.APPWRITE_PROJECT_ID;
        return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${projectId}`;
    }
};
exports.AppwriteService = AppwriteService;
exports.AppwriteService = AppwriteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AppwriteService);
//# sourceMappingURL=appwrite.service.js.map