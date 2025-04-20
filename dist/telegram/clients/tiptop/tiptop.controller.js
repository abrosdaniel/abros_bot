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
var TipTopController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipTopController = void 0;
const common_1 = require("@nestjs/common");
const tiptop_service_1 = require("./tiptop.service");
let TipTopController = TipTopController_1 = class TipTopController {
    constructor(tiptopService) {
        this.tiptopService = tiptopService;
        this.apiKey = process.env.TIPTOP_WEBHOOK_KEY || 'your-secret-key';
        this.logger = new common_1.Logger(TipTopController_1.name);
    }
    onModuleInit() {
        this.logger.log('\n📢 TipTop API Information:');
        this.logger.log('--------------------------------');
        this.logger.log('Endpoint: POST /api/tiptop/currency');
        this.logger.log('Required Headers:');
        this.logger.log('  X-Tiptop-Key: [your webhook key]');
        this.logger.log('Example Request Body:');
        this.logger.log('  {');
        this.logger.log('    "event": "currency_update"');
        this.logger.log('  }');
        this.logger.log('--------------------------------\n');
    }
    async handleWebhook(headers, body, res) {
        this.logger.log('Received API request with headers:', headers);
        this.logger.log('Request body:', body);
        const apiKey = headers['x-tiptop-key'] ||
            headers['X-Tiptop-Key'] ||
            headers['x-tiptop-key'.toLowerCase()] ||
            headers['x-api-key'] ||
            headers['X-Api-Key'];
        if (!apiKey) {
            this.logger.warn('No API key found in headers');
            return res.status(common_1.HttpStatus.FORBIDDEN).json({
                error: 'Access denied: No API key provided',
                headers: headers,
            });
        }
        if (apiKey !== this.apiKey) {
            this.logger.warn('Invalid API key provided');
            return res.status(common_1.HttpStatus.FORBIDDEN).json({
                error: 'Access denied: Invalid API key',
            });
        }
        if (!body || !body.event) {
            this.logger.warn('No event type in request body');
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                error: 'No event type provided',
                receivedBody: body,
            });
        }
        if (body.event === 'currency_update') {
            try {
                this.logger.log('Publishing rates...');
                const result = await this.tiptopService.publishRates();
                this.logger.log('Rates published successfully:', result);
                return res.status(common_1.HttpStatus.OK).json({
                    status: 'success',
                    message: 'Rates published successfully',
                    ...result,
                });
            }
            catch (error) {
                this.logger.error('Error publishing rates:', error);
                return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                    error: 'Failed to publish rates',
                    message: error.message,
                });
            }
        }
        this.logger.warn(`Unsupported event type: ${body.event}`);
        return res.status(common_1.HttpStatus.BAD_REQUEST).json({
            error: 'Unsupported event type',
            receivedEvent: body.event,
        });
    }
};
exports.TipTopController = TipTopController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], TipTopController.prototype, "handleWebhook", null);
exports.TipTopController = TipTopController = TipTopController_1 = __decorate([
    (0, common_1.Controller)('api/tiptop/currency'),
    __metadata("design:paramtypes", [tiptop_service_1.TipTopService])
], TipTopController);
//# sourceMappingURL=tiptop.controller.js.map