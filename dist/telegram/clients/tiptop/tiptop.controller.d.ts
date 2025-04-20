import { OnModuleInit } from '@nestjs/common';
import { Response } from 'express';
import { TipTopService } from './tiptop.service';
export declare class TipTopController implements OnModuleInit {
    private readonly tiptopService;
    private readonly apiKey;
    constructor(tiptopService: TipTopService);
    onModuleInit(): void;
    handleWebhook(apiKey: string, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
}
