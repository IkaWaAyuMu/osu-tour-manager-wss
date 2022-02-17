import serverConfig from "./config/config.json";

import Express from "express";
import { WebSocketServer } from "ws";
import OsuTourManagerWebSocketServerMessage from "./interfaces/OsuTourManagerWebSocketServerMessage";

import sendStrictMessage from "./interfaces/OsuTourManagerWebSocketServer";
import ParseSheet from "./parser";
import TourData from "./interfaces/tourData";
import DraftData from "./interfaces/draftData";


const server = Express().listen(serverConfig.port);
const webSocketServer = new WebSocketServer({ server });

var tourData: TourData[] = require("./fetchData/tourData.json");
var match: {
    round: string,
    match: string,
} = { round: "", match: "" };
var matchIndex: {
    round: number,
    match: number,
} = { round: -1, match: -1 };
var draftData: DraftData[] = [];
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
                tourData = require("./fetchData/tourData.json");
                if (matchIndex.round < 0 || matchIndex.round >= tourData.length || matchIndex.match < 0 || matchIndex.match >= tourData[matchIndex.round].matches.length){
                    match = { round: "", match: "" };
                    matchIndex = { round: -1, match: -1 };
                    for (const socket of webSocketServer.clients) {
                        sendStrictMessage(socket, { message: "getMatch", status: 0, match: match });
                        sendStrictMessage(socket, { message: "getMatchIndex", status: 0, matchIndex: matchIndex })
                    }
                }
                sendStrictMessage(ws, { message: "fetchTourData", status: 0 });
                for (const socket of webSocketServer.clients) {
                    try {
                        if (tourData !== undefined) sendStrictMessage(socket, { message: "getTourData", status: 0, tourData: tourData });
                        else throw new Error("Data not found.");
                    } catch (error) {
                        sendStrictMessage(socket, { message: "getTourData", status: 2, error: error });
                    }
                }
                break;
            case "getTourData":
                try {
                    if (tourData !== undefined) sendStrictMessage(ws, { message: "getTourData", status: 0, tourData: tourData });
                    else throw new Error("Data not found.");
                } catch (error) {
                    sendStrictMessage(ws, { message: "getTourData", status: 2, error: error });
                }
                break;
            case "getMapMod":
                sendStrictMessage(ws, { message: "getMapMod", status: 0, mapMod: getMapMod(tourData, parsedMessage.mapID) });
                break;
            case "setMatch":
                try {
                    if (parsedMessage.match === undefined) { sendStrictMessage(ws, { message: "setMatch", status: 1, error: "No round chosen." }); break; }
                    if (tourData === undefined || tourData === []) { sendStrictMessage(ws, { message: "setMatch", status: 2, error: "Data not found." }); break; }
                    if (parsedMessage.match.round === "") { sendStrictMessage(ws, { message: "setMatch", status: 1, error: "Round not found." }); break; }
                    {
                        let isComplete: boolean = false;
                        tourData.forEach((e, i) => {
                            if (e.round === parsedMessage.match.round) {
                                if (parsedMessage.match.match === "" || tourData[i].matches === undefined) {
                                    match = { round: parsedMessage.match.round, match: "" };
                                    matchIndex = { round: i, match: -1 };
                                    throw new Error("No match available for specified round, Round set.");
                                }
                                tourData[i].matches.forEach((m, j) => {
                                    if (!isComplete && m.match === parsedMessage.match.match) {
                                        match = parsedMessage.match;
                                        matchIndex = { round: i, match: j };
                                        sendStrictMessage(ws, { message: "setMatch", status: 0 });
                                        for (const socket of webSocketServer.clients) {
                                            sendStrictMessage(socket, { message: "getMatch", status: 0, match: match });
                                            sendStrictMessage(socket, { message: "getMatchIndex", status: 0, matchIndex: matchIndex })
                                        }
                                        draftData = [];
                                        for (const socket of webSocketServer.clients) sendStrictMessage(socket, { message: "getDraftData", status: 0, draftData: draftData });
                                        isComplete = true;
                                    }
                                    if (!isComplete && m === tourData[i].matches[tourData[i].matches.length - 1]) {
                                        match = { round: parsedMessage.match.round, match: "" };
                                        matchIndex = { round: i, match: -1 };
                                        throw new Error("Match not found. Round set.");
                                    }
                                });
                            }
                            if (i === tourData.length - 1 && !isComplete) throw new Error("Round not found.");
                        });
                    }
                } catch (error) {
                    if (error = "Round not found.") sendStrictMessage(ws, { message: "setMatch", status: 1, error: "Round not found." });
                    else {
                        sendStrictMessage(ws, { message: "setMatch", status: 4, error: error });
                        for (const socket of webSocketServer.clients) {
                            sendStrictMessage(socket, { message: "getMatch", match: match, status: 4, error: "Match not selected." });
                            sendStrictMessage(socket, { message: "getMatchIndex", status: 4, matchIndex: matchIndex, error: "Match not selected." })
                        }
                        draftData = [];
                        for (const socket of webSocketServer.clients) sendStrictMessage(socket, { message: "getDraftData", status: 0, draftData: draftData });
                    }
                }
                break;
            case "setMatchIndex":
                {
                    if (parsedMessage.matchIndex === undefined) { sendStrictMessage(ws, { message: "setMatchIndex", status: 1, error: "No round chosen." }); break; }
                    if (tourData === undefined || tourData === []) { sendStrictMessage(ws, { message: "setMatchIndex", status: 2, error: "Data not found." }); break; }
                    if (parsedMessage.matchIndex.round < 0 || parsedMessage.matchIndex.round >= tourData.length) { sendStrictMessage(ws, { message: "setMatchIndex", status: 1, error: "Round not found." }); break; }
                    if (parsedMessage.matchIndex.match < 0 || parsedMessage.matchIndex.match >= tourData[parsedMessage.matchIndex.round].matches.length) {
                        match = { round: tourData[parsedMessage.matchIndex.round].round, match: "" };
                        matchIndex = { round: parsedMessage.matchIndex.round, match: -1 };
                        sendStrictMessage(ws, { message: "setMatchIndex", status: 1, error: "Match not found. Round set." });
                        for (const socket of webSocketServer.clients) {
                            sendStrictMessage(socket, { message: "getMatch", match: match, status: 4, error: "Match not selected." });
                            sendStrictMessage(socket, { message: "getMatchIndex", status: 4, matchIndex: matchIndex, error: "Match not selected." })
                        }
                        draftData = [];
                        for (const socket of webSocketServer.clients) sendStrictMessage(socket, { message: "getDraftData", status: 0, draftData: draftData });
                        break;
                    }
                    match = { round: tourData[parsedMessage.matchIndex.round].round, match: tourData[parsedMessage.matchIndex.round].matches[parsedMessage.matchIndex.match].match };
                    matchIndex = { round: parsedMessage.matchIndex.round, match: parsedMessage.matchIndex.match };
                    sendStrictMessage(ws, { message: "setMatchIndex", status: 0 });
                    for (const socket of webSocketServer.clients) {
                        sendStrictMessage(socket, { message: "getMatch", status: 0, match: match });
                        sendStrictMessage(socket, { message: "getMatchIndex", status: 0, matchIndex: matchIndex })
                    }
                    draftData = [];
                    for (const socket of webSocketServer.clients) sendStrictMessage(socket, { message: "getDraftData", status: 0, draftData: draftData });
                }
            case "getMatch":
                if (match === undefined || (matchIndex.round < 0 && matchIndex.match < 0)) sendStrictMessage(ws, { message: "getMatch", match: match, status: 4, error: "Match not selected." });
                if (match === undefined || (matchIndex.round >= 0 && matchIndex.match < 0)) sendStrictMessage(ws, { message: "getMatch", match: match, status: 4, error: "Match not selected." });
                else sendStrictMessage(ws, { message: "getMatch", status: 0, match: match });
            case "getMatchIndex":
                if (match === undefined || (matchIndex.round < 0 && matchIndex.match < 0)) sendStrictMessage(ws, { message: "getMatchIndex", status: 4, matchIndex: matchIndex, error: "Match not selected." });
                if (match === undefined || (matchIndex.round >= 0 && matchIndex.match < 0)) sendStrictMessage(ws, { message: "getMatchIndex", status: 4, matchIndex: matchIndex, error: "Match not selected." });
                else sendStrictMessage(ws, { message: "getMatchIndex", status: 0, matchIndex: matchIndex })
                break;
            case "getMatchInfo":
                if (match === undefined || (matchIndex.round < 0 && matchIndex.match < 0)) sendStrictMessage(ws, { message: "getMatchInfo", status: 3, error: "Match not selected." });
                else if (match === undefined || (matchIndex.round >= 0 && matchIndex.match < 0)) sendStrictMessage(ws, { message: "getMatchInfo", status: 3, error: "Match not selected." });
                else {
                    let matchData = tourData[matchIndex.round].matches[matchIndex.match];
                    sendStrictMessage(ws, {
                        message: "getMatchInfo", status: 0, matchInfo: {
                            round: match.round,
                            match: match.match,
                            dateTime: matchData.dateTime,
                            leftSide: matchData.leftSide,
                            rightSide: matchData.rightSide,
                            referee: matchData.referee,
                            streamer: matchData.streamer,
                            comms1: matchData.comms1,
                            comms2: matchData.comms2,
                            leftScore: matchData.leftScore,
                            rightScore: matchData.rightScore
                        }
                    })
                }
                break;
            case "appendDraftAction":
                if (match === undefined || matchIndex.match < 0) sendStrictMessage(ws, { message: "appendDraftAction", status: 3, error: "Match not selected." });
                else if (parsedMessage.draftAction === undefined) sendStrictMessage(ws, { message: "appendDraftAction", status: 1, error: "No action provide." });
                else if (parsedMessage.draftAction.mapIndex < 0 || parsedMessage.draftAction.mapIndex >= tourData[matchIndex.round].maps.length) sendStrictMessage(ws, { message: "appendDraftAction", status: 1, error: "Invalid mapIndex" });
                else if (draftData.length <= 0) {
                    draftData.push(parsedMessage.draftAction);
                    sendStrictMessage(ws, { message: "appendDraftAction", status: 0 });
                    for (const socket of webSocketServer.clients) sendStrictMessage(socket, { message: "getDraftData", status: 0, draftData: draftData });
                }
                else {
                    if (parsedMessage.draftAction.mapIndex === "PLACEHOLDER") draftData.push(parsedMessage.draftAction);
                    for (let i = 0; i < draftData.length; i++) {
                        if (draftData[i].mapIndex === "PLACEHOLDER" && draftData[i].action === parsedMessage.draftAction.action && draftData[i].side === parsedMessage.draftAction.side) {
                            draftData[i] = parsedMessage.draftAction;
                            sendStrictMessage(ws, { message: "appendDraftAction", status: 0 });
                            for (const socket of webSocketServer.clients) sendStrictMessage(socket, { message: "getDraftData", status: 0, draftData: draftData });
                            break;
                        }
                        if (i === draftData.length - 1) {
                            draftData.push(parsedMessage.draftAction);
                            sendStrictMessage(ws, { message: "appendDraftAction", status: 0 });
                            for (const socket of webSocketServer.clients) sendStrictMessage(socket, { message: "getDraftData", status: 0, draftData: draftData });
                            break;
                        }
                    }
                }
                break;
            case "deleteDraftAction":
                if (parsedMessage.draftAction === undefined) sendStrictMessage(ws, { message: "deleteDraftAction", status: 1, error: "No action provide." });
                else if (draftData === undefined || draftData === []) sendStrictMessage(ws, { message: "deleteDraftAction", status: 4, error: "No action found." });
                else for (let i = 0; i < draftData.length; i++) {
                    if (parsedMessage.draftAction === draftData[i]) {
                        draftData.splice(i, 1);
                        sendStrictMessage(ws, { message: "deleteDraftAction", status: 0 });
                        for (const socket of webSocketServer.clients) sendStrictMessage(socket, { message: "getDraftData", status: 0, draftData: draftData });
                        break;
                    }
                    if (i === draftData.length - 1) sendStrictMessage(ws, { message: "deleteDraftAction", status: 4, error: "No action found." });
                }
                break;
            case "deleteDraftActionIndex":
                if (parsedMessage.draftActionIndex === undefined) sendStrictMessage(ws, { message: "deleteDraftActionIndex", status: 1, error: "No action provide." });
                else if (draftData === undefined || draftData === []) sendStrictMessage(ws, { message: "deleteDraftActionIndex", status: 4, error: "No action found." });
                else if (parsedMessage.draftActionIndex < 0 || parsedMessage.draftActionIndex >= draftData.length) sendStrictMessage(ws, { message: "deleteDraftAction", status: 4, error: "No action found." });
                else {
                        draftData.splice(parsedMessage.draftActionIndex, 1);
                        sendStrictMessage(ws, { message: "deleteDraftAction", status: 0 });
                        for (const socket of webSocketServer.clients) sendStrictMessage(socket, { message: "getDraftData", status: 0, draftData: draftData });
                }
                break;
            case "getDraftData":
                sendStrictMessage(ws, { message: "getDraftData", status: 0, draftData: draftData });
                break;
            default:
                break;
        }
    });
});

function getMapMod(tourData: TourData[], mapID: string): string {
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