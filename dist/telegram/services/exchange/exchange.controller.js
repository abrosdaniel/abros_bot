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
let ExchangeController = class ExchangeController {
    constructor(exchangeService, exchangeDBService) {
        this.exchangeService = exchangeService;
        this.exchangeDBService = exchangeDBService;
        this.apiKey = process.env.EXCHANGE_WEBHOOK_KEY;
    }
    onModuleInit() {
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
        console.log('Commands list:');
        console.log('currency_update - сообщить о изменениях курсов');
        console.log('--------------------------------\n');
    }
    async handleWebhook(apiKey, body, res) {
        console.log('Received API request:', {
            body,
            hasApiKey: !!apiKey,
        });
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
        return res.status(common_1.HttpStatus.BAD_REQUEST).json({
            error: 'Unsupported event type',
        });
    }
};
exports.ExchangeController = ExchangeController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('x-exchange-key')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "handleWebhook", null);
exports.ExchangeController = ExchangeController = __decorate([
    (0, common_1.Controller)('api/exchange'),
    __metadata("design:paramtypes", [exchange_service_1.ExchangeService,
        exchange_service_2.ExchangeDBService])
], ExchangeController);
//# sourceMappingURL=exchange.controller.js.map