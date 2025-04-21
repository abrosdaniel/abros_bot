import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ExchangeDBService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.NOCODB_URL;
    this.apiKey = process.env.NOCODB_API_KEY;
  }

  async getCurrencies() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/db/data/v1/Exchange/Currency`,
        {
          headers: {
            'xc-token': this.apiKey,
          },
        },
      );
      return response.data.list || [];
    } catch (error) {
      console.error('Error getting currencies:', error);
      return [];
    }
  }

  async getCurrency(code: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/db/data/v1/Exchange/Currency`,
        {
          headers: {
            'xc-token': this.apiKey,
          },
          params: {
            where: `(Code,eq,${code})`,
          },
        },
      );
      return response.data.list[0] || null;
    } catch (error) {
      console.error('Error getting currency:', error);
      return null;
    }
  }

  async updateCurrency(
    code: string,
    data: {
      Buy?: number;
      BuyParse?: number;
      BuyProcent?: number;
      Sell?: number;
      SellParse?: number;
      SellProcent?: number;
    },
  ) {
    try {
      const currency = await this.getCurrency(code);
      if (!currency) {
        throw new Error('Currency not found');
      }

      const response = await axios.patch(
        `${this.baseUrl}/api/v1/db/data/v1/Exchange/Currency/${currency.Id}`,
        data,
        {
          headers: {
            'xc-token': this.apiKey,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error updating currency:', error);
      throw error;
    }
  }

  async updateCurrencyValue(
    code: string,
    value: number,
    isPercentage: boolean,
    type: 'buy' | 'sell',
  ): Promise<any> {
    try {
      const currency = await this.getCurrency(code);
      if (!currency) {
        console.error('Currency not found:', code);
        return null;
      }

      const parsePrice =
        type === 'buy'
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
        } else {
          newBuy = Number((parsePrice - value).toFixed(2));
          newBuyPercent = `${value}`;
        }
      } else {
        if (isPercentage) {
          newSell = Number((parsePrice * (1 + value / 100)).toFixed(2));
          newSellPercent = `${value}%`;
        } else {
          newSell = Number((parsePrice + value).toFixed(2));
          newSellPercent = `${value}`;
        }
      }

      const response = await axios.patch(
        `${this.baseUrl}/api/v1/db/data/v1/Exchange/Currency/${currency.Id}`,
        {
          Buy: newBuy,
          Sell: newSell,
          BuyProcent: newBuyPercent,
          SellProcent: newSellPercent,
        },
        {
          headers: {
            'xc-token': this.apiKey,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error updating currency value:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return null;
    }
  }

  async getResources(page: number = 1, limit: number = 10) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/db/data/v1/Exchange/Resources`,
        {
          headers: {
            'xc-token': this.apiKey,
          },
          params: {
            limit,
            offset: (page - 1) * limit,
          },
        },
      );
      return {
        list: response.data.list || [],
        total: response.data.pageInfo.totalRows || 0,
      };
    } catch (error) {
      console.error('Error getting resources:', error);
      return { list: [], total: 0 };
    }
  }

  async getResource(id: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/db/data/v1/Exchange/Resources/${id}`,
        {
          headers: {
            'xc-token': this.apiKey,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error getting resource:', error);
      return null;
    }
  }

  async createResource(data: {
    type: 'channel' | 'chat';
    name: string;
    link: string;
    telegram_id: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/db/data/v1/Exchange/Resources`,
        data,
        {
          headers: {
            'xc-token': this.apiKey,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error creating resource:', error);
      return null;
    }
  }

  async updateResource(
    id: string,
    data: {
      block?: number;
      auto_publish?: number;
      template?: string | null;
    },
  ) {
    try {
      console.log('Updating resource:', { id, data });
      const response = await axios.patch(
        `${this.baseUrl}/api/v1/db/data/v1/Exchange/Resources/${id}`,
        data,
        {
          headers: {
            'xc-token': this.apiKey,
          },
        },
      );
      console.log('Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating resource:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return null;
    }
  }

  async deleteResource(id: string) {
    try {
      await axios.delete(
        `${this.baseUrl}/api/v1/db/data/v1/Exchange/Resources/${id}`,
        {
          headers: {
            'xc-token': this.apiKey,
          },
        },
      );
      return true;
    } catch (error) {
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

        // Пересчитываем курс покупки
        if (currency.BuyProcent) {
          const buyValue = parseFloat(currency.BuyProcent);
          if (currency.BuyProcent.includes('%')) {
            newBuy = Number((buyParsePrice * (1 - buyValue / 100)).toFixed(2));
          } else {
            newBuy = Number((buyParsePrice - buyValue).toFixed(2));
          }
        }

        // Пересчитываем курс продажи
        if (currency.SellProcent) {
          const sellValue = parseFloat(currency.SellProcent);
          if (currency.SellProcent.includes('%')) {
            newSell = Number(
              (sellParsePrice * (1 + sellValue / 100)).toFixed(2),
            );
          } else {
            newSell = Number((sellParsePrice + sellValue).toFixed(2));
          }
        }

        // Обновляем значения в базе, только если они изменились
        if (
          newBuy !== parseFloat(currency.Buy) ||
          newSell !== parseFloat(currency.Sell)
        ) {
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
    } catch (error) {
      console.error('Error recalculating currency rates:', error);
      return {
        success: false,
        message: 'Ошибка при пересчете курсов',
        error: error.message,
      };
    }
  }
}
