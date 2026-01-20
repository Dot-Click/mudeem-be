"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: './src/config/config.env' }); //load env vars
const app_1 = __importDefault(require("./app"));
const db_config_1 = __importDefault(require("./config/db.config"));
const http_1 = __importDefault(require("http"));
const socketService_1 = require("./sockets/socketService");
//server setup
const PORT = process.env.PORT || 8000;
const server = http_1.default.createServer(app_1.default);
socketService_1.socketService.initialize(server);
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    (0, db_config_1.default)();
});
