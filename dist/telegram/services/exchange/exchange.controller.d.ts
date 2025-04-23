import { OnModuleInit } from '@nestjs/common';
import { Response } from 'express';
import { ExchangeService } from './exchange.service';
import { ExchangeDBService } from '../../../database/services/exchange/exchange.service';
import { UserService } from '../../account/user.service';
import { NocoDBService } from '../../../database/nocodb.service';
export declare class ExchangeController implements OnModuleInit {
    private readonly exchangeService;
    private readonly exchangeDBService;
    private readonly userService;
    private readonly nocodbService;
    private readonly apiKey;
    private bot;
    constructor(exchangeService: ExchangeService, exchangeDBService: ExchangeDBService, userService: UserService, nocodbService: NocoDBService);
    onModuleInit(): void;
    handleWebhook(apiKey: string, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
}
