
import WebSocket from "ws";
import OsuTourManagerWebSocketServerSendMessage from "./OsuTourManagerWebSocketServerSendMessage";

/** strictly send OsuTourManagerWebSocketServeSendMessage
 */
export default function sendStrictMessage(socket: WebSocket,message: OsuTourManagerWebSocketServerSendMessage) : void {
        socket.send(JSON.stringify(message));
}