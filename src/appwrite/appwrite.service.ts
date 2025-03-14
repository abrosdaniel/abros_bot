import { Injectable } from '@nestjs/common';
import { Client, Account, Databases, Storage } from 'node-appwrite';

@Injectable()
export class AppwriteService {
  private client: Client;
  private account: Account;
  private databases: Databases;
  private storage: Storage;

  constructor() {
    this.client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);
  }

  getAccount() {
    return this.account;
  }

  getDatabases() {
    return this.databases;
  }

  async getUserData(ctx: any) {
    if (!ctx.callbackQuery) return null;
    const telegramId = ctx.callbackQuery.from.id.toString();
    try {
      // Предполагаем, что у нас есть коллекция users
      const user = await this.databases.listDocuments(
        process.env.APPWRITE_GENERAL_DATABASE_ID,
        'users',
        [`filter=telegramId=${telegramId}`],
      );
      return user.documents[0];
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  async getPortfolioItems() {
    try {
      const items = await this.databases.listDocuments(
        process.env.APPWRITE_GENERAL_DATABASE_ID,
        'portfolio', // Название коллекции в Appwrite
      );
      return items.documents;
    } catch (error) {
      console.error('Error fetching portfolio items:', error);
      return [];
    }
  }

  async getPortfolioItem(itemId: string) {
    try {
      const item = await this.databases.getDocument(
        process.env.APPWRITE_GENERAL_DATABASE_ID,
        'portfolio',
        itemId,
      );
      return item;
    } catch (error) {
      console.error('Error fetching portfolio item:', error);
      return null;
    }
  }

  getImageUrl(fileId: string): string {
    const bucketId = process.env.APPWRITE_BUCKET_ID;
    if (!bucketId) {
      console.error('APPWRITE_BUCKET_ID not set in environment variables');
      return '';
    }

    const endpoint = process.env.APPWRITE_ENDPOINT;
    const projectId = process.env.APPWRITE_PROJECT_ID;

    return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${projectId}`;
  }
}
