"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeModule = void 0;
const common_1 = require("@nestjs/common");
const exchange_service_1 = require("./exchange.service");
const nocodb_service_1 = require("../../../database/nocodb.service");
const exchange_module_1 = require("../../../database/services/exchange/exchange.module");
const exchange_controller_1 = require("./exchange.controller");
let ExchangeModule = class ExchangeModule {
};
exports.ExchangeModule = ExchangeModule;
exports.ExchangeModule = ExchangeModule = __decorate([
    (0, common_1.Module)({
        imports: [exchange_module_1.ExchangeDBModule],
        providers: [exchange_service_1.ExchangeService, nocodb_service_1.NocoDBService],
        exports: [exchange_service_1.ExchangeService],
        controllers: [exchange_controller_1.ExchangeController],
    })
], ExchangeModule);
//# sourceMappingURL=exchange.module.js.map