import { appRoot } from "./AppRoot"
var log = appRoot.logger.createNamedLogger("WsServer")

import * as WebSocket from 'ws';
import { AriNodeBase } from "./common/AriNodeBase"
import { AriClientServer } from "./AriClientServer"

import { AriObject } from "./common/AriObject"

export class WsServer {
    server: WebSocket
    // ariObject: AriObject
    connectionCount = 0
    messageCount = 0
    constructor() {
        // super(null, "WsServer", {})
        // this.ariObject = new AriObject()
        // this.ariNode.pub("_typeDefs", {"WsServer": {
        //     description: "WebSocket server for clients to connect to ARI."
        // }})
        // this.ariNode.pub("_types", ["WsServer"])
        // this.ariObject.pub("connectionCount", this.connectionCount)
        // this.ariObject.pub("messageCount", this.messageCount)
        // this.addOutput("WsMessage", "WsMessage")

        const wss: WebSocket.Server = new WebSocket.Server({ port: 3001 })
        log.debug("WebSocket server listening on port", wss.options.port)
        var self: any = this
        wss.on("connection", (ws: WebSocket, req: any) => {
            log.debug("Client connected from IP:", ws._socket.remoteAddress + ":" + ws._socket.remotePort)

            
            let ch = new AriClientServer(appRoot.ariRoot)
            ch.protocolHandler.out_send = (msg: string) => {
                if (ws.readyState == ws.OPEN) ws.send(msg)
            }
            this.connectionCount++
            // this.ariObject.pub("connectionCount", this.connectionCount)

            ws.on("message", (data: string) => {
                ch.protocolHandler.receive(data)
                    .then((ok) => {
                        if (ok) ws.send(ok)
                    })
                // .catch((err)=>{
                //     ws.send(err)
                // })
                this.messageCount++
                // this.ariObject.pub("messageCount", this.messageCount)
            })
            ws.on("close", () => { 
                ch.close() 
                this.connectionCount--
                // this.ariObject.pub("connectionCount", this.connectionCount)
            })
            ws.on("error", (ws: WebSocket, err: Error) => { 
                this.connectionCount--
                // this.ariObject.pub("connectionCount", this.connectionCount)
            })

        })
    }
}

