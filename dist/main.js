"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const token = configService.get('TELEGRAM_BOT_TOKEN');
    console.log('Bot token:', token ? 'present' : 'missing');
    await app.listen(3001);
}
bootstrap();
//# sourceMappingURL=main.js.map