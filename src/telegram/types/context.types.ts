import { Context } from 'telegraf';

export interface SessionData {
  waitingForPercent?: {
    type: 'buy' | 'sell';
    code: string;
  };
  waitingForResource?: boolean;
  waitingForNews?: boolean;
  waitingForTemplate?: { resourceId: string };
  currentResourcesPage?: number;
}

export interface MyContext extends Context {
  session: SessionData;
}
