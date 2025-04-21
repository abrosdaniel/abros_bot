import { OnModuleInit } from '@nestjs/common';
import { Response } from 'express';
import { ExchangeService } from './exchange.service';
import { ExchangeDBService } from '../../../database/services/exchange/exchange.service';
export declare class ExchangeController implements OnModuleInit {
    private readonly exchangeService;
    private readonly exchangeDBService;
    private readonly apiKey;
    constructor(exchangeService: ExchangeService, exchangeDBService: ExchangeDBService);
    onModuleInit(): void;
    handleWebhook(apiKey: string, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
}
