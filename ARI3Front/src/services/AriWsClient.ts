import { AriProtocolHandler } from "../../../ARI3Back/src/common/AriProtocolHandler"
import { AriNode } from "../common/AriTree"

export class AriWsClient {
    private protocolHandler = new AriProtocolHandler()
    private ariModel = new AriNode()
    private authenticated: boolean = false
    private nextSubId = 0
    private subs: { [subId: number]: { cb: (value: any, resultTree: any, extraArgs: any, subId: number) => void; extraArgs: any } } = {}

    private ws?: WebSocket
    private pingTimer: number = Number.MAX_SAFE_INTEGER
    public pingInterval: number = 1000
    public reconnectInterval!: number
    public connected: boolean = false
    public ping: number = -1

    constructor(nodeName: string, config: any = undefined) {

        this.on(".connection.*", (val=>console.log("*", val)))
        this.set(".connection.test.OK", true, false, false)
        // this.on(".**", (val=>console.log("**", val)))

        this.set(".connection.connected", false)
        this.set(".connection.authenticated", false)

        this.protocolHandler.on("set", (args) => {
            // Remote 
        })

        this._connect()

        // debug output!
        setInterval(()=>{
            console.log("DebugDump:", this.ariModel)
            // this.ariModel.dumpModel()
        }, 5000)
    
    }

    //-------------------------------------------------------------------------
    // Public API
	/**
	 * Set "topic" to a value.
	 * Topic names starting with '.' are considered local - available for remote subscription.
	 * Other topic names are considered "set requests" to remote topics.
	 */
    set(path: string | string[], value: any, storePath = true, storeValue = true) {
        path = typeof path == 'string' ? path.split('.') : path.slice()
        if (path[0] == "") this.ariModel.pub(path, value, storePath, storeValue)
        else {
            console.log("SetRemote:", path, value)
            this.protocolHandler.notify("set", { path, v: value })
        }
    }
    on(path: string | string[], cb: (v: any, subscriptionContext: any) => void, subscriptionContext: any = undefined, storePath = true): number | null {
        path = typeof path == 'string' ? path.split('.') : path.slice()
        if (path[0] == "") return this.ariModel.sub(path, cb, subscriptionContext, storePath)
        else {
            console.log("OnRemote:", path)

            this.protocolHandler.notify("on", { path, subId: this.nextSubId, context: subscriptionContext, storePath })
            this.subs[this.nextSubId] = { cb, extraArgs: subscriptionContext }
            return this.nextSubId++
        }
    }
    async getRoots(){
        return await this.protocolHandler.call("getRoots", {})
    }
    subscribe(elementId: string, cb: (value: any, elementId: string) => void) {
        console.log("SUBSCRIBE:", elementId)
        this.protocolHandler.notify("sub", { id: elementId })
    }
    unsubscribe(elementId: string, cb: (value: any, elementId: string) => void) {
        console.log("SUBSCRIBE:", elementId)
        this.protocolHandler.notify("unsub", { id: elementId })
    }
    async call(path: string, args: any) {
        if (path.startsWith(".") || path.startsWith("/")) {
            // Local call!?
            throw ("Local calls not supported - yet!")
        } else {
            console.log("CallRemote:", path)
            return this.protocolHandler.call("call", { path, args })
        }
    }
    // watch(path: string | string[], cb: (subId: number, v: any, resultTree: any, extraArgs: any) => void, extraArgs: any = undefined): number {
    //     path = typeof path == 'string' ? path.split('.') : path.slice()
    //     if (path[0] == "") return this.ari.on(path, cb, extraArgs)
    //     else {
    //         console.log("WatchRemote:", path)

    //         this.protocolHandler.notify("watch", { path, subId: this.nextSubId, extraArgs })
    //         this.subs[this.nextSubId] = { cb, extraArgs }
    //         return this.nextSubId++
    //     }
    // }
    // ari.onIn(    ".localObject:in1", cb) => cb(localAriRoot.children.localObject.ins.in1)
    // ari.onIn(    ".localObject:in1.v", cb) => cb(localAriRoot.children.localObject.ins.in1)
    // ari.setOut(  ".localObject:out1", value) => localAriRoot.children.localObject.outs.out1 = value

    // ari.call(    ".localObject.calls.call1", args...) => localAriRoot.children.localObject.calls.call1(...args)

    // ari.setIn(   "remoteObject:in1.v", value) => send("remoteObject:in1", value)
    // ari.onOut(   "remoteObject:out1.v", cb) => cb(localAriRoot.children.localObject.ins.in1)
    // ari.call(    "remoteObject:function", args...) => localAriRoot.children.localObject.calls.function(...args)


    // ari.on(      ".outs.connected.v", (v)=>{})
    // ari.on(      ".localObject:ins.in1.*", cb)
    // ari.set(     ".localObject:outs.out1.v", value) => localAriRoot.children.localObject.outs.out1 = value
    // ari.set(     ".localObject:calls.call1.description", "blah blah") 
    // ari.call(    ".localObject:call1", args...) => localAriRoot.children.localObject.calls.call1(...args)

    // ari.set(     "HueGW/Lamps/lamp1.outs.out1.v", value)
    // ari.set(     "HueGW.Lamps.lamp1:outs.out1.v", value)
    // ari.clone(   "HueGW.Lamps.*:outs.*.v") => {HueGW:{Lamps:{lamp1:{outs:{out1:{v:42}}}}
    // ari.watch(   "HueGW.Lamps.*:outs.*.*") => {HueGW:{Lamps:{lamp1:{outs:{out1:{v:42, ts:"1267356"}}}}
    // ari.on(      "HueGW.Lamps.lamp1:outs.brightness.v") => 42
    // ari.on(      "HueGW.Lamps.lamp1:outs.brightness") => {v:42, ts:"1267356"}


    //-------------------------------------------------------------------------
    // Helpers
    _connect() {
        this.ws = new WebSocket("ws://" + window.location.hostname + ":3001")//"ws://localhost:3001")
        var self = this

        this.protocolHandler.onSend = (msg: string) => {
            if (this.ws!.readyState == this.ws!.OPEN) this.ws!.send(msg)
            else console.log("!!!ATTENTION: Sending to server while not connected!")
        }

        this.ws.onopen = async () => {
            // self.ariNode.outs!.connected._set(true)
            this.connected = true
            // $events.emit("connection.connected", true)
            this.set(".connection.connected", true)

            let result = await this.protocolHandler.call("reqAuth", { role: "child", user: "devChild", pw: 42 })
            console.log("Authentication request:", result)
            if (result.token) {
                this.set(".connection.authenticated", true)
                this.set(".connection.ready", true)
                this._handlePing()
            }

        }
        this.ws.onmessage = async (msg: MessageEvent) => {
            let reply = await this.protocolHandler.handleMessage(msg.data)
            if (reply) self.ws!.send(reply)
        }
        this.ws.onerror = () => {
            if (this.pingTimer) clearTimeout(this.pingTimer)
            self.ws!.close()
        }
        this.ws.onclose = () => {
            if (this.pingTimer) clearTimeout(this.pingTimer)
            if (this.connected) this.set(".connection.connected", false)
            this.connected = false
            setTimeout(() => {
                self._connect();
            }, self.reconnectInterval);
        }
    }

    private async _handlePing() {
        let pingTs = Date.now()
        await this.protocolHandler.call("ping", {})
        // this.ariNode.outs!.ping._set(Date.now() - pingTs)
        // $events.emit("connection.ping", Date.now() - pingTs)
        this.set(".connection.ping", Date.now() - pingTs)
        this.ping = Date.now() - pingTs

        let self = this
        this.pingTimer = setTimeout(() => {
            self._handlePing()
        }, this.pingInterval);
    }
}