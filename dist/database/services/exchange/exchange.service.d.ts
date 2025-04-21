export declare class ExchangeDBService {
    private readonly baseUrl;
    private readonly apiKey;
    constructor();
    getCurrencies(): Promise<any>;
    getCurrency(code: string): Promise<any>;
    updateCurrency(code: string, data: {
        Buy?: number;
        BuyParse?: number;
        BuyProcent?: number;
        Sell?: number;
        SellParse?: number;
        SellProcent?: number;
    }): Promise<any>;
    updateCurrencyValue(code: string, value: number, isPercentage: boolean, type: 'buy' | 'sell'): Promise<any>;
    getResources(page?: number, limit?: number): Promise<{
        list: any;
        total: any;
    }>;
    getResource(id: string): Promise<any>;
    createResource(data: {
        type: 'channel' | 'chat';
        name: string;
        link: string;
        telegram_id: string;
    }): Promise<any>;
    updateResource(id: string, data: {
        block?: number;
        auto_publish?: number;
        template?: string | null;
    }): Promise<any>;
    deleteResource(id: string): Promise<boolean>;
    recalculateCurrencyRates(): Promise<{
        success: boolean;
        message: string;
        updatedCount: number;
        updatedCurrencies: any[];
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        updatedCount?: undefined;
        updatedCurrencies?: undefined;
    }>;
}
