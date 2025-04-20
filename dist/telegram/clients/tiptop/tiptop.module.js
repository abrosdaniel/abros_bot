"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipTopModule = void 0;
const common_1 = require("@nestjs/common");
const tiptop_service_1 = require("./tiptop.service");
const nocodb_service_1 = require("../../../database/nocodb.service");
const tiptop_db_module_1 = require("../../../database/clients/tiptop/tiptop-db.module");
const tiptop_controller_1 = require("./tiptop.controller");
let TipTopModule = class TipTopModule {
};
exports.TipTopModule = TipTopModule;
exports.TipTopModule = TipTopModule = __decorate([
    (0, common_1.Module)({
        imports: [tiptop_db_module_1.TipTopDBModule],
        providers: [tiptop_service_1.TipTopService, nocodb_service_1.NocoDBService],
        exports: [tiptop_service_1.TipTopService],
        controllers: [tiptop_controller_1.TipTopController],
    })
], TipTopModule);
//# sourceMappingURL=tiptop.module.js.map