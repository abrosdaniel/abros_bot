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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const appwrite_service_1 = require("../appwrite/appwrite.service");
let UserService = class UserService {
    constructor(appwriteService) {
        this.appwriteService = appwriteService;
    }
    async findByTelegramId(telegramId) {
        try {
            return null;
        }
        catch (error) {
            console.error('Error finding user:', error);
            return null;
        }
    }
    async createUser(userData) {
        try {
            return null;
        }
        catch (error) {
            console.error('Error creating user:', error);
            return null;
        }
    }
    async updateUser(userId, updateData) {
        try {
            return null;
        }
        catch (error) {
            console.error('Error updating user:', error);
            return null;
        }
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [appwrite_service_1.AppwriteService])
], UserService);
//# sourceMappingURL=user.service.js.map