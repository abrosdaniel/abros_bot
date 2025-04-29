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
exports.NocoDBService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let NocoDBService = class NocoDBService {
    constructor() {
        this.baseUrl = process.env.BASE_URL;
        this.apiKey = process.env.BASE_API_KEY;
    }
    generateUserId() {
        return Math.floor(100000000 + Math.random() * 900000000).toString();
    }
    async isUserIdExists(userId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/v1/db/data/v1/Users/User`, {
                headers: {
                    'xc-token': this.apiKey,
                },
                params: {
                    where: `(user_id,eq,${userId})`,
                },
            });
            return response.data.list.length > 0;
        }
        catch (error) {
            console.error('Error checking user_id:', error);
            return false;
        }
    }
    async generateUniqueUserId() {
        let userId;
        let exists;
        do {
            userId = this.generateUserId();
            exists = await this.isUserIdExists(userId);
        } while (exists);
        return userId;
    }
    async findUser(telegramId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/v1/db/data/v1/Users/User`, {
                headers: {
                    'xc-token': this.apiKey,
                },
                params: {
                    where: `(telegram_id,eq,${telegramId})`,
                },
            });
            const user = response.data.list[0] || null;
            return user;
        }
        catch (error) {
            console.error('Error finding user:', error);
            return null;
        }
    }
    async createUser(userData) {
        try {
            const userId = await this.generateUniqueUserId();
            const response = await axios_1.default.post(`${this.baseUrl}/api/v1/db/data/v1/Users/User`, {
                ...userData,
                user_id: userId,
                roles: [],
                subscriptions: [],
            }, {
                headers: {
                    'xc-token': this.apiKey,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error creating user:', error);
            return null;
        }
    }
    async findUserById(userId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/v1/db/data/v1/Users/User`, {
                headers: {
                    'xc-token': this.apiKey,
                },
                params: {
                    where: `(user_id,eq,${userId})`,
                },
            });
            return response.data.list[0] || null;
        }
        catch (error) {
            console.error('Error finding user by ID:', error);
            return null;
        }
    }
    async updateUser(telegramId, userData) {
        try {
            const user = await this.findUser(telegramId);
            if (!user) {
                throw new Error('User not found');
            }
            const response = await axios_1.default.patch(`${this.baseUrl}/api/v1/db/data/v1/Users/User/${user.Id}`, userData, {
                headers: {
                    'xc-token': this.apiKey,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
    async isUserBlocked(telegramId) {
        try {
            const user = await this.findUser(telegramId);
            return user?.block === 1;
        }
        catch (error) {
            console.error('Error checking user block status:', error);
            return false;
        }
    }
    async getAllUsers() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/v1/db/data/v1/Users/User`, {
                headers: {
                    'xc-token': this.apiKey,
                },
            });
            return response.data.list || [];
        }
        catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }
};
exports.NocoDBService = NocoDBService;
exports.NocoDBService = NocoDBService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], NocoDBService);
//# sourceMappingURL=nocodb.service.js.map