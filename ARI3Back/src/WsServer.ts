import { appRoot } from "./AppRoot"
var log = appRoot.logger.createNamedLogger("WsServer")

import * as WebSocket from 'ws';
import { AriNodeBase } from "./common/AriNodeBase"
import { AriClientServer } from "./AriClientServer"

export class WsServer extends AriNodeBase {
    server: WebSocket

    constructor() {
        super(null, "WsServer", {})
        this.addOutput("WsMessage", "WsMessage")

        const wss: WebSocket.Server = new WebSocket.Server({ port: 3001 })
        log.debug("WebSocket server listening on port", wss.options.port)
        var self: any = this
        wss.on("connection", (ws: WebSocket) => {
            log.debug("Client connected:")

            let ch = new AriClientServer(appRoot.ariRoot)
            ch.protocolHandler.onSend = (msg: string) => {
                if (ws.readyState == ws.OPEN) ws.send(msg)
            }

            ws.on("message", (data: string) => {
                ch.protocolHandler.handleMessage(data)
                    .then((ok) => {
                        if (ok) ws.send(ok)
                    })
                // .catch((err)=>{
                //     ws.send(err)
                // })
            })
            ws.on("close", () => { ch.close() })
            ws.on("error", (ws: WebSocket, err: Error) => { })

        })
    }
}

