import TourData from "./tourData";

export default interface OsuTourManagerWebSocketServerSendMessage {
    /** Command message. */
    message : "fetchTourData" | "getTourData" | "getMapMod" | "setMatch" | "getMatch",
    /** Status of after the operation
     * @value 0 : Operation completed normally.
     * @value 1 : No data found.
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
    /** Return Map mods value  from "getMapMod" */
    mapMod?: string
}