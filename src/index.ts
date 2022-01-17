import serverConfig from "./config/config.json";

import Express from "express";
import WebSocket ,{ WebSocketServer } from "ws";


const server = Express().listen(serverConfig.port);
const webSocketServer = new WebSocketServer({server});

console.log("START");

webSocketServer.on('connection', (ws) => {
    
    console.log("Connected");

    ws.on("close", () => console.log("closed"));

    ws.on("message", (message) => {
        console.log("%s", message);

        webSocketServer.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});