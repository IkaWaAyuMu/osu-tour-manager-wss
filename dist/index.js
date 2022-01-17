"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_json_1 = __importDefault(require("./config/config.json"));
const express_1 = __importDefault(require("express"));
const ws_1 = __importStar(require("ws"));
const server = (0, express_1.default)().listen(config_json_1.default.port);
const webSocketServer = new ws_1.WebSocketServer({ server });
console.log("START");
webSocketServer.on('connection', (ws) => {
    console.log("Connected");
    ws.on("close", () => console.log("closed"));
    ws.on("message", (message) => {
        console.log("%s", message);
        webSocketServer.clients.forEach(client => {
            if (client !== ws && client.readyState === ws_1.default.OPEN) {
                client.send(message);
            }
        });
    });
});
//# sourceMappingURL=index.js.map