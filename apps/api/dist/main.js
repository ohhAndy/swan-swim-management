"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const helmet_1 = __importDefault(require("helmet"));
BigInt.prototype.toJSON = function () {
    return this.toString(); // Serialize BigInt IDs as strings
};
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(",")
            : ["http://localhost:3000", "http://localhost:3001"],
        credentials: true,
    });
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}
bootstrap();
