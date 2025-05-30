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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeController = void 0;
const common_1 = require("@nestjs/common");
const exchange_service_1 = require("./exchange.service");
const exchange_service_2 = require("../../../database/services/exchange/exchange.service");
const user_service_1 = require("../../account/user.service");
const nocodb_service_1 = require("../../../database/nocodb.service");
let ExchangeController = class ExchangeController {
    constructor(exchangeService, exchangeDBService, userService, nocodbService) {
        this.exchangeService = exchangeService;
        this.exchangeDBService = exchangeDBService;
        this.userService = userService;
        this.nocodbService = nocodbService;
        this.apiKey = process.env.EXCHANGE_API_KEY;
    }
    onModuleInit() {
        this.bot = this.exchangeService.getBot();
        if (!this.bot) {
            console.error('Bot instance is not initialized in ExchangeService');
        }
        console.log('\n📢 Exchange API Information:');
        console.log('--------------------------------');
        console.log('Endpoint: POST /api/exchange');
        console.log('Required Headers:');
        console.log('  X-Exchange-Key: [your webhook key]');
        console.log('Example Request Body:');
        console.log('  {');
        console.log('    "event": "command"');
        console.log('  }');
        console.log('--------------------------------');
        console.log('Events list:');
        console.log('currency_update - сообщить о изменениях курсов');
        console.log('currency_error - сообщить об ошибке');
        console.log('--------------------------------\n');
    }
    async handleWebhook(apiKey, body, res) {
        if (!apiKey || apiKey !== this.apiKey) {
            console.log('Access denied: Invalid API key');
            return res.status(common_1.HttpStatus.FORBIDDEN).json({
                error: 'Access denied: Invalid API key',
            });
        }
        if (body.event === 'currency_update') {
            try {
                const recalculateResult = await this.exchangeDBService.recalculateCurrencyRates();
                const publishResult = await this.exchangeService.publishRates();
                return res.status(common_1.HttpStatus.OK).json({
                    status: 'success',
                    message: 'Rates updated and published successfully',
                    recalculate: recalculateResult,
                    publish: publishResult,
                });
            }
            catch (error) {
                console.error('Error processing currency update:', error);
                return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                    error: 'Failed to process currency update',
                    message: error.message,
                });
            }
        }
        if (body.event === 'currency_error') {
            try {
                if (!this.bot) {
                    console.error('Bot instance is not initialized');
                    return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                        error: 'Bot instance is not initialized',
                    });
                }
                const users = await this.nocodbService.getAllUsers();
                const developers = [];
                for (const user of users) {
                    const isDev = await this.userService.isDeveloperUser(user.telegram_id);
                    if (isDev) {
                        developers.push(user);
                    }
                }
                if (developers.length === 0) {
                    return res.status(common_1.HttpStatus.OK).json({
                        status: 'success',
                        message: 'No developers found to send error notification',
                    });
                }
                const errorMessage = `⚠️ Ошибка в обменнике:\n\n${body.text}`;
                for (const developer of developers) {
                    try {
                        await this.bot.telegram.sendMessage(developer.telegram_id, errorMessage, {
                            parse_mode: 'HTML',
                        });
                        console.log('Message sent to developer:', developer.user_id);
                    }
                    catch (error) {
                        console.error(`Failed to send error message to developer ${developer.user_id}:`, error);
                    }
                }
                return res.status(common_1.HttpStatus.OK).json({
                    status: 'success',
                    message: 'Error notification sent to developers',
                    developersCount: developers.length,
                });
            }
            catch (error) {
                console.error('Error sending error notification:', error);
                return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                    error: 'Failed to send error notification',
                    message: error.message,
                });
            }
        }
        return res.status(common_1.HttpStatus.BAD_REQUEST).json({
            error: 'Unsupported event type',
        });
    }
};
exports.ExchangeController = ExchangeController;
__decorate([
    (0, common_1.Post)('exchange'),
    __param(0, (0, common_1.Headers)('x-exchange-key')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "handleWebhook", null);
exports.ExchangeController = ExchangeController = __decorate([
    (0, common_1.Controller)('api/v1'),
    __metadata("design:paramtypes", [exchange_service_1.ExchangeService,
        exchange_service_2.ExchangeDBService,
        user_service_1.UserService,
        nocodb_service_1.NocoDBService])
], ExchangeController);
//# sourceMappingURL=exchange.controller.js.map