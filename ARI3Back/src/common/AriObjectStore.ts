// import { AriWsClient } from "@/services/AriWsClient";
import { AriProtocolHandler } from './AriProtocolHandler';
import * as WebSocket from 'ws';
import { ElTableColumn } from 'element-ui/types/table-column';
var cuid = require('cuid');


/*
Arcitecture / protocol stack:
    AriObject
    AriWsClient <- AriClient, AriProtocol
    AriWsClientServer <- AriClientServer, AriProtocol
    AriMemmoryServer

    AriObject
    AriClient
    AriProtocol
    AriWsClient
    ...
    AriWsServer
    AriProtocol
    AriClientServer, 
    AriMemmoryServer


    AriObject
        on
        off
        set
        getUUID
        out_notifySubscribers
    AriClient
        on
        off
        set
        upd
        registerType
        createObject
        out_notify
        out_on
    AriProtocol
        call
        notify
        on
        receive
        out_send
    AriWsClient
        send
        out_received
    ...
    AriWsServer
    AriProtocol
    AriClientServer * x
    AriMemmoryServer
    
    // instantiate
    ariObject = new AriObject()
    ariClient = new AriClient()
    // connect
    ariObject.outs_notifySubscribers = ariClient.ins_notifySubscribers
    ariClient.outs_notify = ariProtocol.notify
    ariClient.outs_on = ariProtocol.on

    
    ariProtocol.out_send = ariWsClient.send
    ariWsClient.out_received = ariProtocol.receive

*/

export interface IAriObject {
    _id: string
    on(subject: string, cb: (value: any, subject: string, objectId: string) => void): void
    off(subject: string, cb: (value: any, subject: string, objectId: string) => void): void
    set(name: string, value: any): void
}
export interface IAriLocalClient {
    id: string
    onLocal(objectId: string, subject: string, cb: (value: any, subject: string, objectId: string) => void): void
    offLocal(objectId: string, subject: string, cb: (value: any, subject: string, objectId: string) => void): void
    setLocal(objectId: string, subject: string, value: any): void
    __getUUID(): string
}
export interface IAriRemoteClient {
    id: string
    __remoteOn(objectId: string, subject: string): void
    __remoteOff(objectId: string, subject: string): void
    __remoteSet(objectId: string, subject: string, value: any): void
    __remoteUpd(objectId: string, subject: string, value: any): void
}
interface IAriClient extends IAriLocalClient, IAriRemoteClient {
}
export interface IAriEngine {
    connectClient(client: IAriClient): Promise<boolean>
    disconnectClient(client: IAriClient): void
    registerType(client: IAriRemoteClient, typeName: string, typeInfo: any): void
    registerObject(client: IAriRemoteClient, objectId: string, mainType: string): void
    on(client: IAriClient, objectId: string, subject: string): void
    off(client: IAriClient, objectId: string, subject: string): void
    set(client: IAriClient, objectId: string, subject: string, value: any): void
    upd(client: IAriClient, objectId: string, subject: string, value: any): void
}

/**
 * Convert between protocol and calls 
 * The ClientServer serves the client!
 * */
class ClientServer implements IAriRemoteClient {
    protocol: AriProtocolHandler
    connected: boolean = false
    authenticated: boolean = false
    engine: AriMemmoryEngine
    id: string = ""
    constructor() {
        this.protocol = new AriProtocolHandler()
        this.engine = AriMemmoryEngine.instance
        this.protocol.on("connect", (args) => { this.engine.connectClient(this) })
        this.protocol.on("disconnect", (args) => { this.engine.disconnectClient(this) })
        this.protocol.on("on", (args) => { this.engine.on(this, args.oid, args.subj) })
        this.protocol.on("off", (args) => { this.engine.off(this, args.oid, args.subj) })
        this.protocol.on("set", (args) => { this.engine.set(this, args.oid, args.subj, args.val) })
        this.protocol.on("upd", (args) => { this.engine.upd(this, args.oid, args.subj, args.val) })
    }
    close(reason: string) {
        console.log(`Client (${this.id} disconnected.)`)
    }
    __remoteOn(objectId: string, subject: string): void {
        this.protocol.emit("on", { oid: objectId, subj: subject })
    }
    __remoteOff(objectId: string, subject: string): void {
        this.protocol.emit("off", { oid: objectId, subj: subject })
    }
    __remoteSet(objectId: string, subject: string, value: any): void {
        this.protocol.emit("set", { oid: objectId, subj: subject, val: value })
    }
    __remoteUpd(objectId: string, subject: string, value: any): void {
        this.protocol.emit("upd", { oid: objectId, subj: subject, val: value })
    }
}

class WsServer {
    constructor() {
        // Set up server...
        const wss: WebSocket.Server = new WebSocket.Server({ port: 3001 })
        console.log("WebSocket server listening on port", wss.options.port)
        var self: any = this
        wss.on("connection", (ws: WebSocket, req: any) => {
            console.log("Client connected from IP:", ws._socket.remoteAddress + ":" + ws._socket.remotePort)

            let cs = new ClientServer()
            cs.protocol.out_send = (msg: string) => {
                if (ws.readyState == ws.OPEN) ws.send(msg)
            }

            ws.on("message", (data: string) => {
                cs.protocol.receive(data)
                    .then((ok) => {
                        if (ok) ws.send(ok)
                    })
                // .catch((err)=>{
                //     ws.send(err)
                // })
            })
            ws.on("close", () => {
                cs.close("Client disconnected.")
            })
            ws.on("error", (ws: WebSocket, err: Error) => {
                cs.close("Error/Client discnnected. Reason: " + err)
            })
        })
    }
}

interface IType {
    name: string,
    info: any
}

class AriMemmoryEngine implements IAriEngine {
    static instance: AriMemmoryEngine = new AriMemmoryEngine()
    clients: { [clientId: string]: { client: IAriRemoteClient, types: { [name: string]: IType } } } = {}
    objects: { [objectId: string]: { type: string, parent: string, subjects: { [subject: string]: { val: any, subscribingClients: Set<string> } } } } = {}
    constructor() {
        if (AriMemmoryEngine.instance) return AriMemmoryEngine.instance
        AriMemmoryEngine.instance = this
    }
    async connectClient(client: IAriRemoteClient): Promise<boolean> {
        console.log(`Engine - client (${client.id}) connected.`)
        this.clients[client.id] = this.clients[client.id] || { types: {} }
        this.clients[client.id].client = client
        // TODO: Get list of objects on client

        // TODO: Subscribe to active subscriptions from other clients.

        // TODO: Check authenticity and authorize
        return Promise.resolve(true)
    }
    registerType(client: IAriRemoteClient, typeName: string, typeInfo: any) {
        console.log("Engine - RegisterType:", typeName)
        this.clients[client.id].types[typeName] = typeInfo
    }
    registerObject(client: IAriRemoteClient, objectId: string, mainType: string) {
        console.log("Engine - RegisterObject:", objectId, mainType)
        this.objects[objectId] = this.objects[objectId] || { subjects: {} }
        let obj = this.objects[objectId]
        obj.type = mainType
        obj.parent = client.id
    }
    getTypeInfo(typeName: string) {
        return {}
    }
    findObjects(typeName: string) {
        let resault = []
        for (let oid in this.objects) {
            let type = this.objects[oid].type
            if (type == typeName) resault.push(oid)
            // TODO: Check sub-types...
        }
    }
    on(client: IAriRemoteClient, objectId: string, subject: string): void {
        console.log("Engine: on")
        // Find client
        // this.clients[client.id].client = client    // FIXME: Create automatically or reject!?
        // let c = this.clients[client.id]
        // if (!c) { console.log("ERROR: Unknown client trying to subscribe!"); return }

        // Find object
        this.objects[objectId] = this.objects[objectId] || { subjects: {} }
        let obj = this.objects[objectId]

        // Find subject
        obj.subjects[subject] = obj.subjects[subject] || { subscribingClients: new Set<string>() }
        let subj = obj.subjects[subject]

        // Store subscription locally
        subj.subscribingClients.add(client.id)

        // If subject known: Send subscription to remote (This will make the object on the client send latest value. The value will then be sent to this subscriber.)
        if (obj.parent) {
            let parent = this.clients[obj.parent]
            if (parent) parent.client.__remoteOn(objectId, subject)
        }
    }
    off(client: IAriRemoteClient, objectId: string, subject: string): void {
        console.log("Engine: off")
        // TODO: Send unsubscription to source client if last client unsubscribed

        // TODO: Remove stored value?
    }
    set(client: IAriRemoteClient, objectId: string, subject: string, value: any): void {
        console.log("Engine: set")
        // Send set-request to source client. (This will then send upd notification if needed.)
        this.clients[this.objects[objectId].parent].client.__remoteSet(objectId, subject, value)
    }
    upd(client: IAriRemoteClient, objectId: string, subject: string, value: any): void {
        console.log("Engine: upd")
        // Store value 
        this.objects[objectId].subjects[subject].val = value
        // Call upd on subscribing clients
        this.objects[objectId].subjects[subject].subscribingClients.forEach((cid) => this.clients[cid].client.__remoteUpd(objectId, subject, value))
    }
    disconnectClient(client: IAriRemoteClient): void {
        console.log(`Engine - client (${client.id}) disconnected.`)
        // TODO: Send unsubscriptions to clients subscribing to objects/subjects on disconnected client.

        // TODO: Unsubscribe subjects if this client was only subscriber to subject.

        // Remove reference to client instance - Keep type info, etc.
        delete this.clients[client.id].client
    }
}

export class AriObject implements IAriObject {
    _id: string
    __client: IAriClient
    constructor({ id, client }: { id: string, client: IAriClient }) {
        console.log("Creating AriObject")
        this.__client = client
        this._id = id || this.__client.__getUUID()
    }
    on(subject: string, cb: (value: any, subject: string, objectId: string) => void) {
        this.__client.onLocal(this._id, subject, cb)
    }
    off(subject: string, cb: (value: any, subject: string, objectId: string) => void) {
        this.__client.offLocal(this._id, subject, cb)
    }
    set(subject: string, value: any) {
        this.__client.setLocal(this._id, subject, value)
    }
}
/** Client handles local nodes
 * Shares a list of types registered by all connected clients.
*/
export class AriClient implements IAriClient {
    __engine: IAriEngine
    id: string
    connected: boolean
    private objects: { [objectId: string]: IAriObject }
    private types: { [typeName: string]: Function }
    private localObjects: { [objectId: string]: { subjects: { [subject: string]: { val: any, hasRemoteSubs: boolean, localSubs: ((value: any, subject: string, objectId: string) => void)[] } } } }
    private remoteObjects: { [objectId: string]: { subjects: { [subject: string]: { val: any, cbs: ((value: any, subject: string, objectId: string) => void)[] } } } }

    // Outputs - need override!
    out_notifyEngine(args: any): void { }
    // out_callEngine(args: any): Promise<any> { return Promise.resolve(true) }
    // out_connectClient(client: IAriClient): void {}
    // out_disconnectClient(client: IAriClient): void {}
    // out_registerType(client: IAriRemoteClient, typeName: string, typeInfo: any): void {}
    // out_registerObject(client: IAriRemoteClient, objectId: string, mainType: string): void {}
    // out_on(client: IAriClient, objectId: string, subject: string): void {}
    // out_off(client: IAriClient, objectId: string, subject: string): void {}
    // out_set(client: IAriClient, objectId: string, subject: string, value: any): void {}
    // out_upd(client: IAriClient, objectId: string, subject: string, value: any): void {}

    constructor(engine: IAriEngine, id?: string) {
        this.__engine = engine
        this.id = id || this.__getUUID()
        this.connected = false
        this.objects = {}
        this.types = {}
        this.remoteObjects = {}
        this.localObjects = {}
        this.connect()
    }
    connect() {
        console.log("CLIENT CONNECT!")
        if (this.__engine.connectClient(this)) this.connected = true
        else this.connected = false

        // Subscribe to registered remote subscriptions 
        for (let rObjId in this.remoteObjects) {
            for (let subj in this.remoteObjects[rObjId].subjects) {
                this.__engine.on(this, rObjId, subj)
                this.out_notifyEngine(["on", rObjId, subj])
            }
        }
    }
    registerType(typeName: string, type: Function) {
        this.types[typeName] = type
        // Share new type w. peers.
        if (this.connected) this.__engine.registerType(this, typeName, type._info)
        this.out_notifyEngine(["regType", typeName, type._info])
    }
    createObject(typeName: string): IAriObject {
        let oid = this.__getUUID()
        this.localObjects[oid] = { subjects: {} }
        // This seems to work!!!! (Call constructor function!)
        let o = new this.types[typeName]({ id: oid, client: this })
        this.objects[o._id] = o
        if (this.connected) this.__engine.registerObject(this, oid, typeName)
        this.out_notifyEngine(["regObj", oid, typeName])
        return o
    }
    findLocalObject(objectId: string): IAriObject {
        return this.objects[objectId]
    }
    async findRemoteObjectIdsByType(name: string): Promise<string[]> {
        let objIds: string[] = []
        this.out_notifyEngine(["findObjTypes", name])
        return objIds
    }
    onLocal(objectId: string, subject: string, cb: (value: any, subject: string, objectId: string) => void): void {
        // Subscribe local subject
        this.localObjects[objectId] = this.localObjects[objectId] || { subjects: {} }
        let obj = this.localObjects[objectId]
        obj.subjects[subject] = obj.subjects[subject] || {}
        let subj = obj.subjects[subject]
        subj.localSubs = subj.localSubs || []
        subj.localSubs.push(cb)
        if ("val" in subj) cb(subj.val, subject, objectId)
    }
    onRemote(objectId: string, subject: string, cb: (value: any, subject: string, objectId: string) => void): void {
        // Store remote subscription
        this.remoteObjects[objectId] = this.remoteObjects[objectId] || { subjects: {} }
        let rObj = this.remoteObjects[objectId]
        rObj.subjects[subject] = rObj.subjects[subject] || {}
        let rSubj = rObj.subjects[subject]
        rSubj.cbs = rSubj.cbs || []
        rSubj.cbs.push(cb)
        // If first subscription, send remote subscription request
        if (rSubj.cbs.length == 1) {
            if (this.connected) this.__engine.on(this, objectId, subject)
            this.out_notifyEngine(["on", objectId, subject])
        } else cb(rSubj.val, subject, objectId)
    }
    offLocal(objectId: string, subject: string, cb: (value: any, name: string, objectId: string) => void): void {
        // Unsubscribe local subject
        let obj = this.localObjects[objectId]
        if (!obj) { console.log("ERROR: Trying to cancel subscription for unknown local object."); return }
        let subj = obj.subjects[subject]
        if (!subj) { console.log("ERROR: Trying to cancel subscription for unknown local subject."); return }
        let i = subj.localSubs.indexOf(cb)
        if (cb) subj.localSubs.splice(i, 1)
    }
    offRemote(objectId: string, subject: string, cb: (value: any, name: string, objectId: string) => void): void {
        // Cancel remote subscription
        let rObj = this.remoteObjects[objectId]
        if (!rObj) { console.log("ERROR: Trying to cancel subscription for unknown remote."); return }
        let rSubj = rObj.subjects[subject]
        if (!rSubj) { console.log("ERROR: Trying to cancel subscription for unknown remote subject."); return }
        let i = rSubj.cbs.indexOf(cb)
        if (cb) rSubj.cbs.splice(i, 1)
        // If last subscription, send remote subscription cancelation
        if (rSubj.cbs.length == 0) {
            if (this.connected) this.__engine.off(this, objectId, subject)
            this.out_notifyEngine(["off", objectId, subject])
        }
    }
    setLocal(objectId: string, subject: string, value: any): void {
        // Set local subject
        this.localObjects[objectId] = this.localObjects[objectId] || { subjects: {} }
        let obj = this.localObjects[objectId]
        obj.subjects[subject] = obj.subjects[subject] || {}
        let subj = obj.subjects[subject]
        subj.val = value

        // Send update notification if subscribed to.
        if (subj.localSubs) subj.localSubs.forEach(cb => cb(value, subject, objectId))
        if (subj.hasRemoteSubs) {
            if (this.connected) this.__engine.upd(this, objectId, subject, value)
            this.out_notifyEngine(["upd", objectId, subject, [value]])
        }
    }
    setRemote(objectId: string, subject: string, value: any): void {
        // Send remote set request
        if (this.connected) this.__engine.set(this, objectId, subject, value)
        this.out_notifyEngine(["set", objectId, subject, value])
    }
    // Calls from remote ---------------------- 
    __remoteOn(objectId: string, subject: string) {
        // Store remote subscription to local subject
        let obj = this.localObjects[objectId]
        if (!obj) { console.log("ERROR: Trying to remotely subscribe to unknown local objectId."); return }
        let subj = obj.subjects[subject]
        if (!subj) { console.log("ERROR: Trying to remotely subscribe to unknown local subject."); return }
        subj.hasRemoteSubs = true
        // Send value if available
        if ("val" in subj) {
            if (this.connected) this.__engine.upd(this, objectId, subject, subj.val)
            this.out_notifyEngine(["upd", objectId, subject, subj.val])
        }
    }
    __remoteOff(objectId: string, subject: string) {
        // Store remote subscription to local subject
        let obj = this.localObjects[objectId]
        if (!obj) { console.log("ERROR: Trying to remotely unsubscribe to unknown local objectId."); return }
        let subj = obj.subjects[subject]
        if (!subj) { console.log("ERROR: Trying to remotely unsubscribe to unknown local subject."); return }
        delete subj.hasRemoteSubs
        // FIXME: Below shouldn't be done - I think!
        // this.out_notifyEngine(["off", objectId, subject])
        // if(this.connected) this.__engine.off(this, objectId, subject)
    }
    __remoteSet(objectId: string, subject: string, value: any) {
        // Remote wants to set local subject!
        // TODO: Implement local access right?
        if (objectId in this.localObjects) {
            // Set local subject 
            let obj = this.localObjects[objectId]
            obj.subjects[subject] = obj.subjects[subject] || {}
            let subj = obj.subjects[subject]
            subj.val = value

            // Send update notification if subscribed to.
            if (subj.localSubs) subj.localSubs.forEach(cb => (cb(value, subject, objectId)))
        } else console.log("ERROR: remoteSet on unknown local object!")
    }
    __remoteUpd(objectId: string, subject: string, value: any) {
        // Subscribed subject was updated.
        if (objectId in this.remoteObjects) {
            let obj = this.remoteObjects[objectId]
            obj.subjects[subject] = obj.subjects[subject] || {}
            let subj = obj.subjects[subject]
            subj.val = value

            // Send update notification to subscribers.
            subj.cbs.forEach(cb => cb(value, subject, objectId))
        } else console.log("ERROR: remoteUpd on unknown remote object!")
    }

    // Helpers ----------------------
    __getUUID = function () {
        return "#" + cuid()
        // return "#" + this.nextUUID++
    }
}

export class AriWsClient {
    private protocol = new AriProtocolHandler()
    private ws!: WebSocket
    private pingTimer: number = Number.MAX_SAFE_INTEGER
    private reconnectInterval = 2000
    private pingInterval = 1000
    private instance!: AriWsClient
    private static __client: AriClient | undefined

    constructor() {
        // Create singleton
        this.instance = this.instance || this
        return this.instance
    }
    public static get client(): AriClient {
        if (AriWsClient.__client) return AriWsClient.__client

        let _ = new AriWsClient()
        // Define handlers for client to be "intercepted" and forwarded...
        let engineProxy = {
            async connectClient(client: IAriClient): Promise<boolean> {
                return await _.protocol.call("connect", { cid: client.id, token: 42 })
            },
            disconnectClient(client: IAriClient): void {
                _.protocol.emit("disconnect", {})
            },
            registerType(client: IAriRemoteClient, typeName: string, typeInfo: any): void {
                _.protocol.emit("regType", { name: typeName, info: typeInfo })
            },
            registerObject(client: IAriRemoteClient, objectId: string, mainType: string): void {
                _.protocol.emit("regObj", { oid: objectId, type: mainType })
            },
            on(client: IAriClient, objectId: string, subject: string): void {
                _.protocol.emit("on", { oid: objectId, subj: subject })
            },
            off(client: IAriClient, objectId: string, subject: string): void {
                _.protocol.emit("off", { oid: objectId, subj: subject })
            },
            set(client: IAriClient, objectId: string, subject: string, value: any): void {
                _.protocol.emit("set", { oid: objectId, subj: subject, val: value })
            },
            upd(client: IAriClient, objectId: string, subject: string, value: any): void {
                _.protocol.emit("upd", { oid: objectId, subj: subject, val: value })
            }
        }

        let client = new AriClient(engineProxy)

        // Connect protocol handler and client instances
        _.protocol.on("on", (args) => {
            // Server subscribes to clients object.
            client.onLocal(args.oid, args.subj, onLocalUpdatesFunc)
        })
        _.protocol.on("off", (args) => {
            // Server subscribes to clients object.
            client.offLocal(args.oid, args.subj, onLocalUpdatesFunc)
        })
        _.protocol.on("set", (args) => {
            // Server request to set subject on clients object.
            client.setLocal(args.oid, args.subj, args.val)
        })
        _.protocol.on("upd", (args) => {
            // Server notification that subscribed subject was updated.
            client.__remoteUpd(args.oid, args.subj, args.val)
        })

        // Helper function used to notify remote subscribers of local changes.
        let onLocalUpdatesFunc = function (val: any, subj: string, oid: string) {
            client.__remoteUpd(oid, subj, val)
        }

        _.__connect()

        AriWsClient.__client = client
        return client
    }

    private __connect() {
        let _ = this
        var isBrowser = new Function("try {return this===window;}catch(e){ return false;}");
        if (isBrowser()) _.ws = new WebSocket("ws://" + window.location.hostname + ":3001") // For browser
        else _.ws = new WebSocket("ws://localhost:3001") // For node.js

        _.protocol.out_send = (msg: string) => {
            if (_.ws!.readyState == _.ws!.OPEN) _.ws!.send(msg)
            else console.log("!!!ATTENTION: Sending to server while not connected!", msg)
        }

        // Handle client connections.
        _.ws.onopen = async () => {
            // this.set(".connection.connected", true)

            // let result = await _.protocol.call("reqAuth", { role: "child", user: "devChild", pw: 42 })
            // console.log("Authentication result:", result)
            // if (result.token) {
            //     // this.set(".connection.authenticated", true)
            //     // this.set(".connection.ready", true)
            // }
            if (AriWsClient.__client) AriWsClient.__client.connect()
            _._handlePing()
        }
        _.ws.onmessage = async (msg: MessageEvent) => {
            let reply = await _.protocol.receive(msg.data)
            if (reply) _.ws!.send(reply)
        }
        _.ws.onerror = () => {
            if (_.pingTimer) clearTimeout(_.pingTimer)
            _.ws!.close()
        }
        _.ws.onclose = () => {
            if (_.pingTimer) clearTimeout(_.pingTimer)
            // if (this.connected) this.set(".connection.connected", false)
            // this.connected = false
            setTimeout(() => {
                _.__connect();
            }, _.reconnectInterval);
        }
    }
    private async _handlePing() {
        let pingTs = Date.now()
        await this.protocol.call("ping", {})
        let ping = Date.now() - pingTs
        // this.ariNode.outs!.ping._set(ping)
        // $events.emit("connection.ping", ping)
        // this.set(".connection.ping", ping)

        let self = this
        this.pingTimer = setTimeout(() => {
            self._handlePing()
        }, this.pingInterval);
    }
}
/*
{"op":"upd","args":{"oid":"#cjzf5ya4c0001q8yc583v1epu","subj":"out_tick","val":[0]}}
["emit","upd","#cjzf5ya4c0001q8yc583v1epu","out_tick",[42]]
["call",42,"#cjzf5ya4c0001q8yc583v1epu","calls_c1",[42]]
["on","#cjzf5ya4c0001q8yc583v1epu","calls_c1"]
["off","#cjzf5ya4c0001q8yc583v1epu","calls_c1"]
*/
// ****************************************************************************
let connect = function (source: IAriObject, sourceSubj: string, dest: IAriObject, destSubj: string) {
    source.on(sourceSubj, (args) => dest.set(destSubj, args))
}
export class AriWsClientTest {
    constructor() {
        // --------------------------------------------------------------------
        // instantiate
        let engine = new AriMemmoryEngine()
        let wss = new WsServer()

        // Client 1
        let c1 = new AriClient(engine)
        c1.registerType("Ticker", TickerObject)
        c1.registerType("ConsoleLogger", LogObject)
        let t = c1.createObject("Ticker")
        t.set("in_interval", 10000)
        let l = c1.createObject("ConsoleLogger")
        t.on("out_tick", (val) => l.set("in_debug", val))
        // c.connect(t._id, "out_tick", l._id, "in_debug", (val)=>{return val})

        // Client 2
        let c2 = new AriClient(engine)
        c2.registerType("ConsoleLogger", LogObject)
        let l2 = c2.createObject("ConsoleLogger")
        c2.onRemote(t._id, "out_tick", (val) => { l2.set("in_debug", val) })

        // console.log("C1:", JSON.stringify(c1, (key, val) => key.startsWith("__") ? undefined : val, 2))
        // console.log("C2:", JSON.stringify(c2, (key, val) => key.startsWith("__") ? undefined : val, 2))
        // console.log("Engine:", JSON.stringify(engine, (key, val) => key.startsWith("__") ? undefined : val, 2))

        let wsc = AriWsClient.client
        wsc.registerType("ConsoleLogger", LogObject)
        let l3 = wsc.createObject("ConsoleLogger")
        wsc.onRemote(t._id, "out_tick", (val) => { l3.set("in_debug", val) })
    }
}

class TickerObject extends AriObject {
    static _info = { description: "Ticker object!" }
    private __count = 0
    private __timeout?: number
    constructor(args: any) {
        super(args)
        console.log("Creating Ticker")
        this.on("in_interval", (val, subject) => {
            if (this.__timeout) clearInterval(this.__timeout)
            this.__timeout = setInterval(() => {
                // console.log("Ticker ticking...")
                this.set("out_tick", this.__count++)
            }, val)
        })
        // Set default and start ticking away.
        this.set("in_interval", 1000)
    }
}
class LogObject extends AriObject {
    constructor(args: any) {
        super(args)
        console.log("Creating Logger")
        this.on("in_debug", (val, subject) => {
            console.log(`Logger (${this._id}): ${val}`)
        })
    }
}

class loggerClient extends AriClient {
    objectProxies: IAriObject[] = []
    constructor(engine: AriMemmoryEngine) {
        super(engine)
        setTimeout(this.init, 0)
    }
    async init() {
        let objIds = await this.findRemoteObjectIdsByType("Functional")
        for (let objId in objIds) {
            this.onLocal(objId, "out__log", (value, subject, objectId) => {
                console.log("LOG:", objId + subject, "=", value)
            })
        }
    }
}
