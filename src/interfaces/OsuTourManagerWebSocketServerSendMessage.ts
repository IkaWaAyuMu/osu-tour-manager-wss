import TourData from "./tourData";

export default interface OsuTourManagerWebSocketServerSendMessage {
    /** Command message. */
    message : "fetchTourData" | "getTourData" | "getMapMod" | "setMatch" | "setMatchIndex" | "getMatch" | "getMatchIndex" | "getMatchInfo",
    /** Status of after the operation
     * @value 0 : Operation completed normally.
     * @value 1 : Invalid parameters.
     * @value 2 : No data found.
     * @value 3 : Only partial data found
     * @value 4 : Operation completed normally, but not practical result.
     */
    status: number,
    /** Error message */
    error?: any,
    /** Return TourData value from "getTourData"*/
    tourData?: TourData[], 
    /** Return selected round/match from websocket. */
    match?: {
        round: string,
        match: string, 
    },
    matchIndex?: {
        round: number,
        match: number, 
    },
    matchInfo?: {
        round: string,
        match: string,
        dateTime: Date,
        leftSide?: string,
        rightSide?: string,
        referee?: string,
        streamer?: string,
        comms1?: string,
        comms2?: string
        leftScore?: number,
        rightScore?: number 
    },
    /** Return Map mods value  from "getMapMod" */
    mapMod?: string
}