"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegram_service_1 = require("./telegram.service");
const nocodb_service_1 = require("../database/nocodb.service");
const config_1 = require("@nestjs/config");
const account_service_1 = require("./account.service");
const admin_service_1 = require("./admin.service");
const tiptop_module_1 = require("./clients/tiptop/tiptop.module");
const tiptop_service_1 = require("./clients/tiptop/tiptop.service");
const tiptop_db_module_1 = require("../database/clients/tiptop/tiptop-db.module");
const telegraf_1 = require("telegraf");
let TelegramModule = class TelegramModule {
};
exports.TelegramModule = TelegramModule;
exports.TelegramModule = TelegramModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            nestjs_telegraf_1.TelegrafModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    token: configService.get('TELEGRAM_BOT_TOKEN'),
                    middlewares: [
                        (0, telegraf_1.session)({
                            defaultSession: () => ({}),
                            getSessionKey: (ctx) => ctx.from?.id.toString(),
                        }),
                    ],
                }),
                inject: [config_1.ConfigService],
            }),
            tiptop_module_1.TipTopModule,
            tiptop_db_module_1.TipTopDBModule,
        ],
        providers: [
            telegram_service_1.TelegramService,
            nocodb_service_1.NocoDBService,
            account_service_1.AccountService,
            admin_service_1.AdminService,
            tiptop_service_1.TipTopService,
        ],
        exports: [telegram_service_1.TelegramService],
    })
], TelegramModule);
//# sourceMappingURL=telegram.module.js.map