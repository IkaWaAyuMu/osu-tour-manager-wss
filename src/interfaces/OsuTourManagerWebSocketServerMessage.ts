export default interface OsuTourManagerWebSocketServerMessage {
    /** Message to define what websocket should send
     *  @param message  one of the following
     *                  "getMappool" Get all maps in mappool in sellected round.
     *                  "getMapMod" Get map num from mappool.
     */
    message : "getMappool" | "getMapMod",
    MapID? : Number
}