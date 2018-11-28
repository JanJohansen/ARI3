import { Observable, Subject, fromEventPattern, BehaviorSubject } from "rxjs"
import Vue from 'vue';

export class WebSocketService {
    ws: WebSocket
    connected$ = new BehaviorSubject(false)
    data$ = new Subject<string>()
    log$ = new Subject<string>()
    pingInterval!: number
    pingTs!: number

    ariNode = {
        name: "ServerConnection",
        outs: {
            connected: {
                v: false,
                observable: this.connected$
            },
            log$: {
                observable: this.log$
            }
        }
    }
    constructor() {
        this.ws = new WebSocket("ws://localhost:8081")
        var self = this
        this.ws.onopen = () => {
            self.ws.send("Hellow ARI :O)")
            self.ariNode.outs.connected.v = true
            self.connected$.next(true)

            self.pingInterval = setInterval(() => {
                self.pingTs = Date.now()
                self.ws.send('{op:"ping"}')
            }, 5000)
        }
        this.ws.onmessage = (msg: MessageEvent) => {
            self.data$.next(msg.data)
        }
        this.ws.onerror = () => {
            self.connected$.next(false)
            self.ariNode.outs.connected.v = false
        }
        this.ws.onclose = () => {
            self.connected$.next(false)
            self.ariNode.outs.connected.v = false
        }

        this.data$.subscribe((data: string) => {
            try {
                var json = JSON.parse(data)
            }
            catch {
                //ari.send("logs.WebSocketService", "Error: Error in JSON!", data)
                //ariRoot = { logs: { WebSocketService: { v: "err...", v$: "observable" } } }
            }
        })
    }
}