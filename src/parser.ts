import PublicGoogleSheetsParser from "public-google-sheets-parser";
import sheetParserConfig from "./config/sheetParserConfig.json"
import fs from "fs";
import TourData from "./interfaces/tourData";


/**
 * Parse the data from sheets.
 */
export default function ParseSheet(sheetID: string = sheetParserConfig.sheetID): void {

    let tourData: TourData[] = [];

    new PublicGoogleSheetsParser(sheetID, 'RoundParseable').parse().then((roundData) => {
        new PublicGoogleSheetsParser(sheetID, 'MappoolParseable').parse().then((mappoolData) => {
            new PublicGoogleSheetsParser(sheetID, 'ScheduleParseable').parse().then((scheduleData) => {
                roundData.forEach(round => { tourData.push({round: round.round, bestOf: round.bestOf, banCount:round.bansCount, maps: [], matches: []}); });
                mappoolData.forEach(map => { tourData.forEach(round => { 
                    if (map.round === round.round) { round.maps.push({mod: map.mod, mapID: map.mapID}); return; }
                });});
                scheduleData.forEach(match => { tourData.forEach(round => { 
                    if (match.round === round.round) { round.matches.push({
                        match: match.match,
                        dateTime: combineDateTime(match.date, match.time),
                        leftSide: match.leftside,
                        rightSide: match.rightSide,
                        referee: match.referee,
                        streamer: match.streamer,
                        comms1: match.comms1,
                        comms2: match.comms2
                    }); return; }
                });});
                fs.writeFileSync('dist/fetchdata/tourData.json', JSON.stringify(tourData, null, 2));
            });;
        });;
    });; 
}

function combineDateTime(date: String, time: string): Date {
    date = date.replace("Date", "");
    date = date.replace("(", "");
    date = date.replace(")", "");
    time = time.replace("Date", "");
    time = time.replace("(", "");
    time = time.replace(")", "");
    let rawVal: string[] = date.split(",");
    rawVal = rawVal.concat(time.split(","));
    return new Date(+rawVal[0], +rawVal[1], +rawVal[2], +rawVal[6], +rawVal[7]);
}