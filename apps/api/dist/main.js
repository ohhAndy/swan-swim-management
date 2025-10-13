"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
BigInt.prototype.toJSON = function () {
    return this.toString(); // Serialize BigInt IDs as strings
};
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: ['http://localhost:3000', 'http://localhost:3001'] });
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}
bootstrap();
