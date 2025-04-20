import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NocoDBService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.NOCODB_URL;
    this.apiKey = process.env.NOCODB_API_KEY;
  }

  private generateUserId(): string {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  }

  private async isUserIdExists(userId: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/db/data/v1/Users/User`,
        {
          headers: {
            'xc-token': this.apiKey,
          },
          params: {
            where: `(user_id,eq,${userId})`,
          },
        },
      );
      return response.data.list.length > 0;
    } catch (error) {
      console.error('Error checking user_id:', error);
      return false;
    }
  }

  private async generateUniqueUserId(): Promise<string> {
    let userId: string;
    let exists: boolean;

    do {
      userId = this.generateUserId();
      exists = await this.isUserIdExists(userId);
    } while (exists);

    return userId;
  }

  async findUser(telegramId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/db/data/v1/Users/User`,
        {
          headers: {
            'xc-token': this.apiKey,
          },
          params: {
            where: `(telegram_id,eq,${telegramId})`,
          },
        },
      );
      const user = response.data.list[0] || null;
      return user;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  async createUser(userData: {
    telegram_id: string;
    telegram_username?: string;
    first_name?: string;
    last_name?: string;
  }) {
    try {
      const userId = await this.generateUniqueUserId();
      const response = await axios.post(
        `${this.baseUrl}/api/v1/db/data/v1/Users/User`,
        {
          ...userData,
          user_id: userId,
          roles: [],
          subscriptions: [],
        },
        {
          headers: {
            'xc-token': this.apiKey,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async findUserById(userId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/db/data/v1/Users/User`,
        {
          headers: {
            'xc-token': this.apiKey,
          },
          params: {
            where: `(user_id,eq,${userId})`,
          },
        },
      );
      return response.data.list[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  async updateUser(
    telegramId: string,
    userData: {
      telegram_username?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      block?: number;
    },
  ) {
    try {
      const user = await this.findUser(telegramId);
      if (!user) {
        throw new Error('User not found');
      }

      const response = await axios.patch(
        `${this.baseUrl}/api/v1/db/data/v1/Users/User/${user.Id}`,
        userData,
        {
          headers: {
            'xc-token': this.apiKey,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async isUserBlocked(telegramId: string): Promise<boolean> {
    try {
      const user = await this.findUser(telegramId);
      return user?.block === 1;
    } catch (error) {
      console.error('Error checking user block status:', error);
      return false;
    }
  }

  async getAllUsers() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/db/data/v1/Users/User`,
        {
          headers: {
            'xc-token': this.apiKey,
          },
        },
      );
      return response.data.list || [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
}
