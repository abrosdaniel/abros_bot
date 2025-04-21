"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeDBModule = void 0;
const common_1 = require("@nestjs/common");
const exchange_service_1 = require("./exchange.service");
let ExchangeDBModule = class ExchangeDBModule {
};
exports.ExchangeDBModule = ExchangeDBModule;
exports.ExchangeDBModule = ExchangeDBModule = __decorate([
    (0, common_1.Module)({
        providers: [exchange_service_1.ExchangeDBService],
        exports: [exchange_service_1.ExchangeDBService],
    })
], ExchangeDBModule);
//# sourceMappingURL=exchange.module.js.map