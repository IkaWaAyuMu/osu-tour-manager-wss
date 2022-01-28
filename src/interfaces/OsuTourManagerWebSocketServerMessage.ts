export default interface OsuTourManagerWebSocketServerMessage {
    /** Message to define what websocket should send
     *  @param message  one of the following.
     *                  "fetchTourData" Fetch map data from configurated sheet.
     *                  "getMappool" Get all maps in mappool in sellected round.
     *                  "getMapMod" Get map num from mappool.
     */
    message : "fetchTourData" | "getTourData" | "getMapMod" | "setMatch" | "getMatch",
    /** Selected round/match. */
    match?: {
        round: string,
        match: string, 
    },
    /** Map ID to get map mod. */
    mapID? : string
}