import { Subject } from "rxjs"
import Vue from 'vue';

export class WebSocketService {
    ws: WebSocket
    connected = new Subject()
    inData = new Subject()
    ariNode = {
        name: "ServerConnection",
        outs: {
            connected: {
                v: false
            }
        }
    }
    constructor() {
        this.ws = new WebSocket("ws://localhost:8081")
        var self = this
        this.ws.onopen = () => {
            self.ws.send("Hellow ARI :O)")
            self.ariNode.outs.connected.v = true
        }
        this.ws.onmessage = (msg: MessageEvent) => {
            self.inData.next(msg)
        }
        this.ws.onerror = () => {
            self.connected.next(false)
            self.ariNode.outs.connected.v = false
        }
        this.ws.onclose = () => {
            self.connected.next(false)
            self.ariNode.outs.connected.v = false
        }
    }
}