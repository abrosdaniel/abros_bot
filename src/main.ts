import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const token = configService.get('TELEGRAM_BOT_TOKEN');
  console.log('Bot token:', token ? 'present' : 'missing');
  await app.listen(3001);
}
bootstrap();
