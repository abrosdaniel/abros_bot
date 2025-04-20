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
exports.TipTopController = void 0;
const common_1 = require("@nestjs/common");
const tiptop_service_1 = require("./tiptop.service");
let TipTopController = class TipTopController {
    constructor(tiptopService) {
        this.tiptopService = tiptopService;
        this.apiKey = process.env.TIPTOP_WEBHOOK_KEY || 'your-secret-key';
    }
    onModuleInit() {
        console.log('\n📢 TipTop API Information:');
        console.log('--------------------------------');
        console.log('Endpoint: POST /api/tiptop/currency');
        console.log('Required Headers:');
        console.log('  X-Tiptop-Key: [your webhook key]');
        console.log('Example Request Body:');
        console.log('  {');
        console.log('    "event": "currency_update"');
        console.log('  }');
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
                const result = await this.tiptopService.publishRates();
                return res.status(common_1.HttpStatus.OK).json({
                    status: 'success',
                    message: 'Rates published successfully',
                    ...result,
                });
            }
            catch (error) {
                console.error('Error publishing rates:', error);
                return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                    error: 'Failed to publish rates',
                    message: error.message,
                });
            }
        }
        return res.status(common_1.HttpStatus.BAD_REQUEST).json({
            error: 'Unsupported event type',
        });
    }
};
exports.TipTopController = TipTopController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('x-tiptop-key')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TipTopController.prototype, "handleWebhook", null);
exports.TipTopController = TipTopController = __decorate([
    (0, common_1.Controller)('api/tiptop/currency'),
    __metadata("design:paramtypes", [tiptop_service_1.TipTopService])
], TipTopController);
//# sourceMappingURL=tiptop.controller.js.map