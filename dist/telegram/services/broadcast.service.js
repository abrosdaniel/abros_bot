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
exports.BroadcastService = void 0;
const common_1 = require("@nestjs/common");
const nocodb_service_1 = require("../../database/nocodb.service");
let BroadcastService = class BroadcastService {
    constructor(nocodbService) {
        this.nocodbService = nocodbService;
    }
    async sendBroadcast(ctx, message, media) {
        try {
            const users = await this.nocodbService.getAllUsers();
            let successCount = 0;
            let failCount = 0;
            for (const user of users) {
                try {
                    if (media) {
                        if (media.type === 'photo') {
                            await ctx.telegram.sendPhoto(user.telegram_id, media.file_id, {
                                caption: message,
                                parse_mode: 'HTML',
                            });
                        }
                        else if (media.type === 'video') {
                            await ctx.telegram.sendVideo(user.telegram_id, media.file_id, {
                                caption: message,
                                parse_mode: 'HTML',
                            });
                        }
                        else if (media.type === 'document') {
                            await ctx.telegram.sendDocument(user.telegram_id, media.file_id, {
                                caption: message,
                                parse_mode: 'HTML',
                            });
                        }
                    }
                    else {
                        await ctx.telegram.sendMessage(user.telegram_id, message, {
                            parse_mode: 'HTML',
                        });
                    }
                    successCount++;
                }
                catch (error) {
                    console.error(`Error sending message to user ${user.telegram_id}:`, error);
                    failCount++;
                }
            }
            return {
                success: successCount,
                failed: failCount,
                total: users.length,
            };
        }
        catch (error) {
            console.error('Error in broadcast:', error);
            throw error;
        }
    }
};
exports.BroadcastService = BroadcastService;
exports.BroadcastService = BroadcastService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nocodb_service_1.NocoDBService])
], BroadcastService);
//# sourceMappingURL=broadcast.service.js.map