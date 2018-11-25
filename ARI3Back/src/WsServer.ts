import { appRoot } from "./AppRoot"
var log = appRoot.logger.createNamedLogger("main")
import * as WebSocket from 'ws';

import { Subject, Observable, fromEvent } from "rxjs"

export class WsServer {
    server: WebSocket
    socketStream: Subject<WebSocket>
    constructor() {
        const wss: WebSocket.Server = new WebSocket.Server({ port: 8081 })
        log.debug("WebSocket server listening on port", wss.options.port)
        this.socketStream = new Subject<WebSocket>()
        wss.on("connection", (ws: WebSocket) => {
            this.socketStream.next(ws)
        })
        this.socketStream.subscribe(
            (webSocket) => {
                log.debug("Client connected:")
                var msgStream = new Subject<{socket: WebSocket, data: string}>()
                webSocket.on("message", (data: string) => {
                    msgStream.next({socket: webSocket, data: data})
                })
                webSocket.on("close", () => msgStream.complete())
                webSocket.on("error", (ws: WebSocket, err: Error) => msgStream.error("Socket error: " + err.message))

                msgStream.subscribe(
                    (msg) => { log.debug("wsRx:", msg.socket.readyState, msg.data) },
                    (websocket) => { log.debug("Error: Socket error!") },
                    () => { log.debug("Client disconnected:") }
                )
            },
            () => { log.developer("Error: WsServer error!") },
            () => { log.developer("Error: WebsocketServer ended!") }
        )
    }
}