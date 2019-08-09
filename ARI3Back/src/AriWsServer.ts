import { appRoot } from "./AppRoot"
var log = appRoot.logger.createNamedLogger("WsServer")

import * as WebSocket from 'ws';
import { AriObject } from "./common/AriObjectStore";
// import { AriClientServer } from "./AriClientServer"

// [WsServer]-->{data, cid}-->[AriProtocol]-->{cid, protocolHandler: {notify(), call(), on()}-->[ClientsHandler]-->{cid, }-->[AriMemmoryEngine]

export class WsServer extends AriObject {
    server: WebSocket
    connections = 0
    messages = 0
    constructor() {
        super()
        this.set("out_message", null)
        this.set("out_connections", this.connections)

        const wss: WebSocket.Server = new WebSocket.Server({ port: 3001 })
        log.debug("WebSocket server listening on port", wss.options.port)
        var self: any = this
        wss.on("connection", (ws: WebSocket, req: any) => {
            log.debug("Client connected from IP:", ws._socket.remoteAddress + ":" + ws._socket.remotePort)

            this.connections++
            this.set("out_connections", this.connections)

            let ch = new AriClientServer(appRoot.ariRoot)
            ch.protocolHandler.out_send = (msg: string) => {
                if (ws.readyState == ws.OPEN) ws.send(msg)
            }

            ws.on("message", (data: string) => {
                this.set("out_message", { data, __client: ws })


                ch.protocolHandler.receive(data)
                    .then((ok) => {
                        if (ok) ws.send(ok)
                    })
                // .catch((err)=>{
                //     ws.send(err)
                // })
                this.messages++
                this.set("out_messages", this.messages)
            })
            ws.on("close", () => {
                ch.close()
                this.connections--
                this.set("out_connections", this.connections)
            })
            ws.on("error", (ws: WebSocket, err: Error) => {
                this.connections--
                this.set("out_connections", this.connections)
            })
        })
    }
}

