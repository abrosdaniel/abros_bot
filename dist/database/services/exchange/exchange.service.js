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
exports.ExchangeDBService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let ExchangeDBService = class ExchangeDBService {
    constructor() {
        this.baseUrl = process.env.NOCODB_URL;
        this.apiKey = process.env.NOCODB_API_KEY;
    }
    async getCurrencies() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/v1/db/data/v1/Exchange/Currency`, {
                headers: {
                    'xc-token': this.apiKey,
                },
            });
            return response.data.list || [];
        }
        catch (error) {
            console.error('Error getting currencies:', error);
            return [];
        }
    }
    async getCurrency(code) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/v1/db/data/v1/Exchange/Currency`, {
                headers: {
                    'xc-token': this.apiKey,
                },
                params: {
                    where: `(Code,eq,${code})`,
                },
            });
            return response.data.list[0] || null;
        }
        catch (error) {
            console.error('Error getting currency:', error);
            return null;
        }
    }
    async updateCurrency(code, data) {
        try {
            const currency = await this.getCurrency(code);
            if (!currency) {
                throw new Error('Currency not found');
            }
            const response = await axios_1.default.patch(`${this.baseUrl}/api/v1/db/data/v1/Exchange/Currency/${currency.Id}`, data, {
                headers: {
                    'xc-token': this.apiKey,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error updating currency:', error);
            throw error;
        }
    }
    async updateCurrencyValue(code, value, isPercentage, type) {
        try {
            const currency = await this.getCurrency(code);
            if (!currency) {
                console.error('Currency not found:', code);
                return null;
            }
            const parsePrice = type === 'buy'
                ? parseFloat(currency.BuyParse)
                : parseFloat(currency.SellParse);
            let newBuy = parseFloat(currency.Buy);
            let newSell = parseFloat(currency.Sell);
            let newBuyPercent = currency.BuyProcent;
            let newSellPercent = currency.SellProcent;
            if (type === 'buy') {
                if (isPercentage) {
                    newBuy = Number((parsePrice * (1 - value / 100)).toFixed(2));
                    newBuyPercent = `${value}%`;
                }
                else {
                    newBuy = Number((parsePrice - value).toFixed(2));
                    newBuyPercent = `${value}`;
                }
            }
            else {
                if (isPercentage) {
                    newSell = Number((parsePrice * (1 + value / 100)).toFixed(2));
                    newSellPercent = `${value}%`;
                }
                else {
                    newSell = Number((parsePrice + value).toFixed(2));
                    newSellPercent = `${value}`;
                }
            }
            const response = await axios_1.default.patch(`${this.baseUrl}/api/v1/db/data/v1/Exchange/Currency/${currency.Id}`, {
                Buy: newBuy,
                Sell: newSell,
                BuyProcent: newBuyPercent,
                SellProcent: newSellPercent,
            }, {
                headers: {
                    'xc-token': this.apiKey,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error updating currency value:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            return null;
        }
    }
    async getResources(page = 1, limit = 10) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/v1/db/data/v1/Exchange/Resources`, {
                headers: {
                    'xc-token': this.apiKey,
                },
                params: {
                    limit,
                    offset: (page - 1) * limit,
                },
            });
            return {
                list: response.data.list || [],
                total: response.data.pageInfo.totalRows || 0,
            };
        }
        catch (error) {
            console.error('Error getting resources:', error);
            return { list: [], total: 0 };
        }
    }
    async getResource(id) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/v1/db/data/v1/Exchange/Resources/${id}`, {
                headers: {
                    'xc-token': this.apiKey,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting resource:', error);
            return null;
        }
    }
    async createResource(data) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/v1/db/data/v1/Exchange/Resources`, data, {
                headers: {
                    'xc-token': this.apiKey,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error creating resource:', error);
            return null;
        }
    }
    async updateResource(id, data) {
        try {
            console.log('Updating resource:', { id, data });
            const response = await axios_1.default.patch(`${this.baseUrl}/api/v1/db/data/v1/Exchange/Resources/${id}`, data, {
                headers: {
                    'xc-token': this.apiKey,
                },
            });
            console.log('Update response:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('Error updating resource:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            return null;
        }
    }
    async deleteResource(id) {
        try {
            await axios_1.default.delete(`${this.baseUrl}/api/v1/db/data/v1/Exchange/Resources/${id}`, {
                headers: {
                    'xc-token': this.apiKey,
                },
            });
            return true;
        }
        catch (error) {
            console.error('Error deleting resource:', error);
            return false;
        }
    }
    async recalculateCurrencyRates() {
        try {
            const currencies = await this.getCurrencies();
            const updatedCurrencies = [];
            for (const currency of currencies) {
                const buyParsePrice = parseFloat(currency.BuyParse);
                const sellParsePrice = parseFloat(currency.SellParse);
                let newBuy = parseFloat(currency.Buy);
                let newSell = parseFloat(currency.Sell);
                if (currency.BuyProcent) {
                    const buyValue = parseFloat(currency.BuyProcent);
                    if (currency.BuyProcent.includes('%')) {
                        newBuy = Number((buyParsePrice * (1 - buyValue / 100)).toFixed(2));
                    }
                    else {
                        newBuy = Number((buyParsePrice - buyValue).toFixed(2));
                    }
                }
                if (currency.SellProcent) {
                    const sellValue = parseFloat(currency.SellProcent);
                    if (currency.SellProcent.includes('%')) {
                        newSell = Number((sellParsePrice * (1 + sellValue / 100)).toFixed(2));
                    }
                    else {
                        newSell = Number((sellParsePrice + sellValue).toFixed(2));
                    }
                }
                if (newBuy !== parseFloat(currency.Buy) ||
                    newSell !== parseFloat(currency.Sell)) {
                    const updated = await this.updateCurrency(currency.Code, {
                        Buy: newBuy,
                        Sell: newSell,
                    });
                    updatedCurrencies.push(updated);
                }
            }
            return {
                success: true,
                message: 'Курсы успешно пересчитаны',
                updatedCount: updatedCurrencies.length,
                updatedCurrencies,
            };
        }
        catch (error) {
            console.error('Error recalculating currency rates:', error);
            return {
                success: false,
                message: 'Ошибка при пересчете курсов',
                error: error.message,
            };
        }
    }
};
exports.ExchangeDBService = ExchangeDBService;
exports.ExchangeDBService = ExchangeDBService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ExchangeDBService);
//# sourceMappingURL=exchange.service.js.map