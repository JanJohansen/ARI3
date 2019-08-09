// import { AriWsClient } from "@/services/AriWsClient";
import { AriProtocolHandler } from './AriProtocolHandler';
import { __makeTemplateObject } from 'tslib';

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
    AriClientServer, 
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

var cuid = require('cuid');
// import { cuid } from "cuid"
// let nextUUID = 0

export interface IAriObject {
    _id: string
    on(subject: string, cb: (value: any, subject: string, objectId: string) => void): void
    off(subject: string, cb: (value: any, subject: string, objectId: string) => void): void
    set(name: string, value: any): void
}
export interface IAriClient {
    id: string
    onLocal(objectId: string, subject: string, cb: (value: any, subject: string, objectId: string) => void): void
    offLocal(objectId: string, subject: string, cb: (value: any, subject: string, objectId: string) => void): void
    setLocal(objectId: string, subject: string, value: any): void

    __remoteOn(objectId: string, subject: string): void
    __remoteOff(objectId: string, subject: string): void
    __remoteSet(objectId: string, subject: string, value: any): void
    __remoteUpd(objectId: string, subject: string, value: any): void

    __getUUID(): string
}
export interface IAriEngine {
    connectClient(client: IAriClient): void
    disconnectClient(client: IAriClient): void
    on(client: IAriClient, objectId: string, subject: string): void
    off(client: IAriClient, objectId: string, subject: string): void
    set(client: IAriClient, objectId: string, subject: string, value: any): void
    upd(client: IAriClient, objectId: string, subject: string, value: any): void
}


/*
connector: {
    clients: {
        cid_x: {
            objects: {
                oid_x: {

                },
            },
            subs: ["oid_sid", "oid_sid"],
            
        }
    },
    objects: {
        oid_x: {
            subject_x: subject_x_Value,
            subject_y: subject_y_Value,
        }
    }

}
*/
interface IType {
    name: string
    typeInfo: any
}
interface IClient {
    id: string
    objects: { [objectId: string]: IObject }
}
interface IObject {
    id: string
    type: string
    subjects: { [subject: string]: ISubject }
}
interface ISubject {
    val: any
    subscribingClients: Set<string>
}

class AriMemmoryEngine implements IAriEngine {
    static instance: AriMemmoryEngine = new AriMemmoryEngine()
    types: { [name: string]: IType }
    clients: { [clientId: string]: IAriClient }
    objects: { [objectId: string]: { type: string, parent: string, subjects: { [subject: string]: { val: any, subscribingClients: Set<string> } } } }
    constructor() {
        this.types = {}
        this.clients = {}
        this.objects = {}
        if (AriMemmoryEngine.instance) return AriMemmoryEngine.instance
        AriMemmoryEngine.instance = this
    }

    registerType(client: IAriClient, typeName: string, typeInfo: any) {
        console.log("Engine - RegisterType:", typeName)
        this.types[typeName] = typeInfo
    }
    registerObject(client: IAriClient, objectId: string, mainType: string) {
        console.log("Engine - RegisterObject:", objectId, mainType)
        this.objects[objectId] = this.objects[objectId] || { subjects: {} }
        let obj = this.objects[objectId]
        obj.type = mainType
        obj.parent = client.id
    }
    on(client: IAriClient, objectId: string, subject: string): void {
        console.log("Engine: on")
        // Find client
        this.clients[client.id] = client    // FIXME: Create automatically or reject!?
        let c = this.clients[client.id]
        if (!c) { console.log("ERROR: Unknown client trying to subscribe!"); return }

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
            if (parent) parent.__remoteOn(objectId, subject)
        }
    }
    off(client: IAriClient, objectId: string, subject: string): void {
        console.log("Engine: off")
    }
    set(client: IAriClient, objectId: string, subject: string, value: any): Promise<boolean> {
        console.log("Engine: set")
        // TODO: ...
        return Promise.resolve(true) 
    }
    upd(client: IAriClient, objectId: string, subject: string, value: any): Promise<boolean> {
        console.log("Engine: upd")
        // TODO: ...
        return Promise.resolve(true)
    }
    connectClient(client: IAriClient): void {
        console.log(`Engine - client (${client.id}) connected.`)
        this.clients[client.id] = client
        // TODO: Get list of objects on client

        // TODO: Subscribe to active subscriptions from other clients.
    }
    disconnectClient(client: IAriClient): void {
        console.log(`Engine - client (${client.id}) disconnected.`)
        // TODO: Send unsubscriptions to clients subscribing to objects on disconnected client.

        delete this.clients[client.id]
    }
    __notifyRemote(objectId: string, subject: string, value: any): void {
        throw new Error("Method not implemented.");
    }
}
export class localClient {
    client = new AriClient()
    on = this.client.onLocal
    off = this.client.offLocal
    engine: AriMemmoryEngine
    constructor(engine: AriMemmoryEngine) {
        this.engine = engine
        engine.connectClient(this.client)
    }
}

class AriClientServer implements IAriClient {
    id: string;
    private protocolHandler = new AriProtocolHandler()
    constructor() {
        this.protocolHandler.on("upd", this.upd)
    }
    upd(args: any) {

    }
    onLocal(objectId: string, subject: string, cb: (value: any, subject: string, objectId: string) => void): void {
        throw new Error("Method not implemented.");
    }
    offLocal(objectId: string, subject: string, cb: (value: any, subject: string, objectId: string) => void): void {
        throw new Error("Method not implemented.");
    }
    setLocal(objectId: string, subject: string, value: any): void {
        throw new Error("Method not implemented.");
    }
    upd(objectId: string, subject: string, value: any): void {
        throw new Error("Method not implemented.");
    }
}
// interface IAriProtocolConsumer {
//     notify(functionName: string, args: any): void
//     call(functionName: string, args: any): Promise<any>
//     on(functionName: string, args: any): void
// }
// interface IAriProtocolProvider {
//     onSend(message: string): void   // Override to send message to peer.
//     handleMessage(message: string): void
// }

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
    static info = {
        "out_notify": { description: "Send notification to server.", type: "(functionName: string, args: any): void" },
    }
    __engine: AriMemmoryEngine
    id: string
    objects: { [objectId: string]: IAriObject }
    types: { [typeName: string]: Function }
    localEngine: { [objectId: string]: { subjects: { [subject: string]: { val: any, hasRemoteSubs: boolean, localSubs: ((value: any, subject: string, objectId: string) => void)[] } } } }
    remoteEngine: { [objectId: string]: { subjects: { [subject: string]: { val: any, cbs: ((value: any, subject: string, objectId: string) => void)[] } } } }

    // Outputs
    // out_notify(functionName: string, args: any): void { throw ("Missing override!") }

    constructor(engine: AriMemmoryEngine, id?: string) {
        this.__engine = engine
        this.id = id || this.__getUUID()
        this.objects = {}
        this.types = {}
        this.remoteEngine = {}
        this.localEngine = {}
        this.__engine.connectClient(this)
    }
    registerType(typeName: string, type: Function) {
        this.types[typeName] = type
        // TODO: Share new type w. peers?
        this.__engine.registerType(this, typeName, type._info)
    }
    createObject(typeName: string): IAriObject {
        // DOES THIS WORK!???????????????????????????????????????????????????????????????????????????????????????????????????????????????
        let oid = this.__getUUID()
        this.localEngine[oid] = { subjects: {} }
        let o = new this.types[typeName]({ id: oid, client: this })
        this.objects[o._id] = o
        this.__engine.registerObject(this, oid, typeName)
        return o
    }
    findLocalObject(objectId: string): IAriObject {
        return this.objects[objectId]
    }
    async findRemoteObjectIdsByType(name: string): Promise<string[]> {
        let objIds: string[] = []
        //...
        return objIds
    }
    onLocal(objectId: string, subject: string, cb: (value: any, subject: string, objectId: string) => void): void {
        // Subscribe local subject
        this.localEngine[objectId] = this.localEngine[objectId] || { subjects: {} }
        let obj = this.localEngine[objectId]
        obj.subjects[subject] = obj.subjects[subject] || {}
        let subj = obj.subjects[subject]
        subj.localSubs = subj.localSubs || []
        subj.localSubs.push(cb)
        if ("val" in subj) cb(subj.val, subject, objectId)
    }
    onRemote(objectId: string, subject: string, cb: (value: any, subject: string, objectId: string) => void): void {
        // Store remote subscription
        this.remoteEngine[objectId] = this.remoteEngine[objectId] || { subjects: {} }
        let rObj = this.remoteEngine[objectId]
        rObj.subjects[subject] = rObj.subjects[subject] || {}
        let rSubj = rObj.subjects[subject]
        rSubj.cbs = rSubj.cbs || []
        rSubj.cbs.push(cb)
        // If first subscription, send remote subscription request
        if (rSubj.cbs.length == 1) this.__engine.on(this, objectId, subject)
        else cb(rSubj.val, subject, objectId)
    }
    offLocal(objectId: string, subject: string, cb: (value: any, name: string, objectId: string) => void): void {
        // Unsubscribe local subject
        let obj = this.localEngine[objectId]
        if (!obj) { console.log("ERROR: Trying to cancel subscription for unknown local object."); return }
        let subj = obj.subjects[subject]
        if (!subj) { console.log("ERROR: Trying to cancel subscription for unknown local subject."); return }
        let i = subj.localSubs.indexOf(cb)
        if (cb) subj.localSubs.splice(i, 1)
    }
    offRemote(objectId: string, subject: string, cb: (value: any, name: string, objectId: string) => void): void {
        // Cancel remote subscription
        let rObj = this.remoteEngine[objectId]
        if (!rObj) { console.log("ERROR: Trying to cancel subscription for unknown remote."); return }
        let rSubj = rObj.subjects[subject]
        if (!rSubj) { console.log("ERROR: Trying to cancel subscription for unknown remote subject."); return }
        let i = rSubj.cbs.indexOf(cb)
        if (cb) rSubj.cbs.splice(i, 1)
        // If last subscription, send remote subscription cancelation
        if (rSubj.cbs.length == 0) this.__engine.off(this, objectId, subject)
    }
    setLocal(objectId: string, subject: string, value: any): void {
        // Set local subject
        this.localEngine[objectId] = this.localEngine[objectId] || { subjects: {} }
        let obj = this.localEngine[objectId]
        obj.subjects[subject] = obj.subjects[subject] || {}
        let subj = obj.subjects[subject]
        subj.val = value

        // Send update notification if subscribed to.
        if (subj.localSubs) subj.localSubs.forEach(cb => cb(value, subject, objectId))
        if (subj.hasRemoteSubs) this.__engine.upd(this, objectId, subject, value)
    }
    setRemote(objectId: string, subject: string, value: any): void {
        // Send remote set request
        this.__engine.set(this, objectId, subject, value)
    }
    // Calls from remote ---------------------- 
    __remoteOn(objectId: string, subject: string) {
        // Store remote subscription to local subject
        let obj = this.localEngine[objectId]
        if (!obj) { console.log("ERROR: Trying to remotely subscribe to unknown local objectId."); return }
        let subj = obj.subjects[subject]
        if (!subj) { console.log("ERROR: Trying to remotely subscribe to unknown local subject."); return }
        subj.hasRemoteSubs = true
        // Send value if available
        if ("val" in subj) this.__engine.upd(this, objectId, subject, subj.val)
    }
    __remoteOff(objectId: string, subject: string) {
        // Store remote subscription to local subject
        let obj = this.localEngine[objectId]
        if (!obj) { console.log("ERROR: Trying to remotely unsubscribe to unknown local objectId."); return }
        let subj = obj.subjects[subject]
        if (!subj) { console.log("ERROR: Trying to remotely unsubscribe to unknown local subject."); return }
        delete subj.hasRemoteSubs
    }
    __remoteSet(objectId: string, subject: string, value: any) {
        // Remote wants to set local subject!
        // TODO: Implement local access right?
        if (objectId in this.localEngine) {
            // Set local subject
            let obj = this.localEngine[objectId]
            obj.subjects[subject] = obj.subjects[subject] || {}
            let subj = obj.subjects[subject]
            subj.val = value

            // Send update notification if subscribed to.
            if (subj.localSubs) subj.localSubs.forEach(cb => (cb(value, subject, objectId)))
        } else console.log("ERROR: remoteSet on unknown local object!")
    }
    __remoteUpd(objectId: string, subject: string, value: any) {
        // Subscribed subject was updated.
        if (objectId in this.remoteEngine) {
            let obj = this.remoteEngine[objectId]
            obj.subjects[subject] = obj.subjects[subject] || {}
            let subj = obj.subjects[subject]
            subj.val = value

            // Send update notification to subscribers.
            subj.cbs.forEach(cb => cb(value, subject, objectId))
        } else console.log("ERROR: remoteUpd on unknown local object!")
    }

    // Helpers ----------------------
    __getUUID = function () {
        return "#" + cuid()
        // return "#" + this.nextUUID++
    }
}
export class AriWsClient {
    private client = new AriClient()
    private protocol = new AriProtocolHandler()
    private ws!: WebSocket
    private pingTimer: number = Number.MAX_SAFE_INTEGER
    private reconnectInterval = 2000
    private pingInterval = 1000

    out_received: (msg: any) => void = () => { }

    constructor(id?: string) {
        let _ = this

        // this.client.out_on = this.protocol.on
        _.client.out_notify = _.protocol.notify

        // Callback function used to notify remote subscribers of local changes.
        let onLocalUpdatesFunc = function (value: any, subject: string, objectId: string) {
            _.client.out_notify("upd", { val: value, subj: subject, objId: objectId })
        }
        // Connect protocol handler and client instances
        _.protocol.on("on", (args) => {
            // Server subscribes to clients object.
            _.client.onLocal(args.objId, args.subj, onLocalUpdatesFunc)
        })
        _.protocol.on("off", (args) => {
            // Server subscribes to clients object.
            _.client.offLocal(args.objId, args.subj, onLocalUpdatesFunc)
        })
        _.protocol.on("set", (args) => {
            // Server request to set subject on clients object.
            _.client.setLocal(args.objId, args.subj, args.val)
        })
        _.protocol.on("upd", (args) => {
            // Server notification that subscribed subject was updated.
            _.client.__notifyLocal(args.objId, args.subj, args.val)
        })

        _.__connect()
    }

    // Expose client calls
    registerType = this.client.registerType
    createObject = this.client.createObject
    findLocalObject = this.client.findLocalObject
    findRemoteObjectIdsByType = this.client.findRemoteObjectIdsByType
    on = this.client.onLocal
    off = this.client.offLocal
    set = this.client.setLocal

    private __connect() {
        let _ = this
        // _.ws = new WebSocket("ws://localhost:3001") // For node.js
        _.ws = new WebSocket("ws://" + window.location.hostname + ":3001") // For browser

        _.protocol.out_send = (msg: string) => {
            if (_.ws!.readyState == _.ws!.OPEN) _.ws!.send(msg)
            else console.log("!!!ATTENTION: Sending to server while not connected!")
        }

        // Handle client connections.
        _.ws.onopen = async () => {
            // this.set(".connection.connected", true)

            let result = await _.protocol.call("reqAuth", { role: "child", user: "devChild", pw: 42 })
            console.log("Authentication result:", result)
            if (result.token) {
                // this.set(".connection.authenticated", true)
                // this.set(".connection.ready", true)
            }
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


// ****************************************************************************
let connect = function (source: IAriObject, sourceSubj: string, dest: IAriObject, destSubj: string) {
    source.on(sourceSubj, (args) => dest.set(destSubj, args))
}
export class AriWsClientTest {
    constructor() {
        // --------------------------------------------------------------------
        // instantiate
        let engine = new AriMemmoryEngine()
        let c1 = new AriClient(engine)
        c1.registerType("Ticker", TickerObject)
        c1.registerType("ConsoleLogger", LogObject)
        let t = c1.createObject("Ticker")
        let l = c1.createObject("ConsoleLogger")
        t.on("out_tick", (val) => l.set("in_debug", val))
        // c.connect(t._id, "out_tick", l._id, "in_debug", (val)=>{return val})

        let c2 = new AriClient(engine)
        c2.registerType("ConsoleLogger", LogObject)
        let l2 = c2.createObject("ConsoleLogger")
        c2.onRemote(t._id, "out_tick", (val) => {
            l2.set("in_debug", val)
        })

        console.log("C1:", JSON.stringify(c1, (key, val) => key.startsWith("__") ? undefined : val, 2))
        console.log("C2:", JSON.stringify(c2, (key, val) => key.startsWith("__") ? undefined : val, 2))
        console.log("Engine:", JSON.stringify(engine, (key, val) => key.startsWith("__") ? undefined : val, 2))

    }
}

class TickerObject extends AriObject {
    static _info = { description: "Ticker object!" }
    private __count = 0
    private __timeout?: number
    constructor(client: IAriClient) {
        super(client)
        console.log("Creating Ticker")
        this.on("in_interval", (val, subject) => {
            if (this.__timeout) clearInterval(this.__timeout)
            this.__timeout = setInterval(() => {
                console.log("Ticker ticking...")
                this.set("out_tick", this.__count++)
            }, val)
        })
        // Set default and start ticking away.
        this.set("in_interval", 1000)
    }
}
class LogObject extends AriObject {
    constructor(client: IAriClient) {
        super(client)
        console.log("Creating Logger")
        this.on("in_debug", (val, subject) => {
            console.log(val)
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
