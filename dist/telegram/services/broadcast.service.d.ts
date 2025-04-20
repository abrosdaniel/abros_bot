import { NocoDBService } from '../../database/nocodb.service';
import { MyContext } from '../types/context.types';
export declare class BroadcastService {
    private readonly nocodbService;
    constructor(nocodbService: NocoDBService);
    sendBroadcast(ctx: MyContext, message: string, media?: any): Promise<{
        success: number;
        failed: number;
        total: any;
    }>;
}
