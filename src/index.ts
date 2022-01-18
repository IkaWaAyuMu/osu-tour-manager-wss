import serverConfig from "./config/config.json";

import Express from "express";
import { WebSocketServer } from "ws";
import OsuTourManagerWebSocketServerMessage from "./interfaces/OsuTourManagerWebSocketServerMessage";

import MappoolData from "./interfaces/mappoolData";
import mappoolsData from "./fetchdata/mappools.json"
import sendStrictMessage from "./interfaces/OsuTourManagerWebSocketServer";


const server = Express().listen(serverConfig.port);
const webSocketServer = new WebSocketServer({server});

console.log("START");

webSocketServer.on('connection', (ws) => {
    
    console.log("Connected");

    ws.on("close", () => console.log("closed"));

    ws.on("message", (message) => {
        console.log(message.toString());
        let parsedMessage : OsuTourManagerWebSocketServerMessage;

        try {parsedMessage = JSON.parse(message.toString())}
        catch {return;}
        switch (parsedMessage.message) {
            case "getMappool":
                ws.send("MAPPOOL");
                break;
            case "getMapMod" :
                sendStrictMessage(ws, {mapMod: getMapMod(parsedMessage.mapID)});
                break;
            default:
                break;
        }
    });
});

function getMapMod(mapID: Number) : string {
    const mappools: MappoolData = mappoolsData;
    let mapMod: string = "NONE";
    if (mapID === undefined || mappools.maps === undefined) return mapMod;
    mappools.maps.forEach(map => {
        if (map.Id === mapID) {
            mapMod = map.Mod;
            return;
        }
    });
    return mapMod;
}