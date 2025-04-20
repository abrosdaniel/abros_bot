"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastModule = void 0;
const common_1 = require("@nestjs/common");
const broadcast_service_1 = require("./broadcast.service");
const nocodb_module_1 = require("../../database/nocodb.module");
let BroadcastModule = class BroadcastModule {
};
exports.BroadcastModule = BroadcastModule;
exports.BroadcastModule = BroadcastModule = __decorate([
    (0, common_1.Module)({
        imports: [nocodb_module_1.NocoDBModule],
        providers: [broadcast_service_1.BroadcastService],
        exports: [broadcast_service_1.BroadcastService],
    })
], BroadcastModule);
//# sourceMappingURL=broadcast.module.js.map