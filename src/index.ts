import serverConfig from "./config/config.json";

import Express from "express";
import { WebSocketServer } from "ws";
import OsuTourManagerWebSocketServerMessage from "./interfaces/OsuTourManagerWebSocketServerMessage";

import sendStrictMessage from "./interfaces/OsuTourManagerWebSocketServer";
import ParseSheet from "./parser";
import TourData from "./interfaces/tourData";


const server = Express().listen(serverConfig.port);
const webSocketServer = new WebSocketServer({ server });

var match: {
    round: string,
    match: string,
} = { round: "", match: "" };
var matchIndex: {
    round: number,
    match: number,
} = { round: -1, match: -1 };
console.log("START");

webSocketServer.on('connection', (ws) => {

    console.log("Connected");

    ws.on("close", () => console.log("closed"));

    ws.on("message", (message) => {
        console.log(message.toString());
        let parsedMessage: OsuTourManagerWebSocketServerMessage;

        try { parsedMessage = JSON.parse(message.toString()) }
        catch { return; }
        switch (parsedMessage.message) {
            case "fetchTourData":
                ParseSheet();
                delete require.cache[require.resolve("./fetchData/tourData.json")]
                let tourData: TourData[] = require("./fetchData/tourData.json");
                if (tourData === undefined) throw new Error("Data not found.");
                try {
                    tourData.forEach((e, i) => {
                        if (e.round === parsedMessage.match.round) {
                            if (tourData[i].matches === undefined) throw new Error("No match available for specified round.");
                            tourData[i].matches.forEach((m, j) => {
                                if (m.match === parsedMessage.match.match) throw new Error("OK");
                                if (m === tourData[i].matches[tourData[i].matches.length - 1]) throw new Error("Match not found.");
                            });
                        }
                        if (i === tourData.length - 1) throw new Error("Round not found.");
                    });
                } catch (error) {
                    if (error !== "OK") {
                        match = { round: "", match: "" };
                        matchIndex = { round: -1, match: -1 };
                    }
                }
                sendStrictMessage(ws, { message: "fetchTourData", status: 0 });
                break;
            case "getTourData":
                try {
                    delete require.cache[require.resolve("./fetchData/tourData.json")]
                    let tourData: TourData[] = require("./fetchData/tourData.json");
                    if (tourData !== undefined) sendStrictMessage(ws, { message: "getTourData", status: 0, tourData: tourData });
                    else throw new Error("Data not found.");
                } catch (error) {
                    sendStrictMessage(ws, { message: "getTourData", status: 1, error: error });
                }
                break;
            case "getMapMod":
                sendStrictMessage(ws, { message: "getMapMod", status: 0, mapMod: getMapMod(parsedMessage.mapID) });
                break;
            case "setMatch":
                try {
                    if (parsedMessage.match === undefined) throw new Error("No round chosen.");
                    delete require.cache[require.resolve("./fetchData/tourData.json")]
                    let tourData: TourData[] = require("./fetchData/tourData.json");
                    if (tourData === undefined || tourData === []) throw new Error("Data not found.");
                    if (parsedMessage.match.round === "") throw new Error("Round not found.");
                    else {
                        let isComplete: boolean = false;
                        tourData.forEach((e, i) => {
                            if (e.round === parsedMessage.match.round) {
                                if (parsedMessage.match.match === "" || tourData[i].matches === undefined) {
                                    match = { round: parsedMessage.match.round, match: "" };
                                    matchIndex = { round: i, match: -1 };
                                    sendStrictMessage(ws, { message: "setMatch", status: 1 });
                                    throw new Error("No match available for specified round, Round set.");
                                }
                                tourData[i].matches.forEach((m, j) => {
                                    if (m.match === parsedMessage.match.match) {
                                        match = parsedMessage.match;
                                        matchIndex = { round: i, match: j };
                                        sendStrictMessage(ws, { message: "setMatch", status: 0 });
                                        isComplete = true;
                                    }
                                    if (m === tourData[i].matches[tourData[i].matches.length - 1] && !isComplete) { throw new Error("Match not found."); }
                                });
                            }
                            if (i === tourData.length - 1 && !isComplete) throw new Error("Round not found.");
                        });
                    }
                } catch (error) {
                    if (error !== "OK") { console.log(`Send ${error}`); sendStrictMessage(ws, { message: "setMatch", status: 1, error: error }); }
                }
                break;
            case "getMatch":
                if (match === undefined || (matchIndex.round < 0 && matchIndex.match < 0)) sendStrictMessage(ws, { message: "getMatch", status: 1, error: "Match not selected." });
                if (match === undefined || (matchIndex.round >= 0 && matchIndex.match < 0)) sendStrictMessage(ws, { message: "getMatch", match: match, status: 1, error: "Match not selected." });
                else sendStrictMessage(ws, { message: "getMatch", status: 0, match: match });
        }
    });
});

function getMapMod(mapID: string): string {
    delete require.cache[require.resolve("./fetchData/tourData.json")]
    let tourData: TourData[] = require("./fetchData/tourData.json");
    let mapMod: string = "NONE";
    if (matchIndex.round < 0) return mapMod;
    if (mapID === undefined || tourData[matchIndex.round].maps === undefined) return mapMod;
    tourData[matchIndex.round].maps.forEach(map => {
        if (map.mapID === mapID) {
            mapMod = map.mod;
            return;
        }
    });
    return mapMod;
}