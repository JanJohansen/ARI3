import { callbackify } from "util";
import { OuterSubscriber } from "rxjs/internal/OuterSubscriber";
import { SSL_OP_NETSCAPE_CHALLENGE_BUG } from "constants";

//*****************************************************************************
// Interfaces

// interface for saving, restoring state.
// Use same interface for getting updtes to part config/state and for sending change notifications?
interface INodeConfig {
    ins?: { [name: string]: any },
    outs?: { [name: string]: any }
}


//*****************************************************************************
// Classes

//*****************************************************************************
export class AriNodeInput implements AriNodeInput {
    __parent: AriNodeBase
    name: string
    type: string
    _onSet: ((value: any, input: AriNodeInput) => void) | null = null
    constructor(parent: AriNodeBase, name: string, type: string, callback: ((value: any, input: AriNodeInput) => void) | null = null) {
        this.__parent = parent
        this.name = name
        this.type = type
        if (callback) this._onSet = callback
    }
    set(value: any): void {
        if (this._onSet) this._onSet(value, this)
    }
    _get(value: any): void {
        if (this._onSet) this._onSet(value, this)
    }
}

//*****************************************************************************
export class AriNodeCall implements AriNodeCall {
    __parent: AriNodeBase
    name: string
    type: string
    _onCall: (args: any) => Promise<any>
    constructor(parent: AriNodeBase, name: string, type: string, callFunction: (args: any) => Promise<any>) {
        this.__parent = parent
        this.name = name
        this.type = type
        this._onCall = callFunction
    }
    async call(args: any): Promise<any> {
        return this._onCall(args)
    }
}

//*****************************************************************************
export class AriNodeOutput implements AriNodeOutput {
    __parent: AriNodeBase
    name: string
    v?: any
    _subIds: number[] | undefined // Used bu external subscriptions
    _callbacks: ((value: any, output: AriNodeOutput) => void)[] | undefined
    constructor(parent: AriNodeBase, name: string, defaultValue: any = undefined) {
        this.__parent = parent
        this.name = name
        if (defaultValue != undefined) this.v = defaultValue
    }
    /** Subscribe to output */
    subscribe(reqId: number): void {
        this._subIds = this._subIds || []
        this._subIds.push(reqId)
    }
    unsubscribe(reqId: number): void {
        this._subIds = this._subIds || []
        let idx = this._subIds.indexOf(reqId)
        if (idx >= 0) this._subIds.splice(idx, 1)
    }

    /** Implementor interface! */
    _on(cb: (value: any, output: AriNodeOutput) => void) {
        this._callbacks = this._callbacks || []
        this._callbacks.push(cb)
    }

    /** Implementor interface! */
    _emit(value: any): void {
        for (let cb in this._callbacks!) {
            this._callbacks![cb](value, this)
        }
        // TODO: bubble to parent...
    }
    /** Implementor interface! */
    _set(value: any): void {
        for (let cb in this._callbacks!) {
            this._callbacks![cb](value, this)
        }
        this.v = value
    }
    /** Implementor interface! */
    _next(value: any): void {
        for (let cb in this._callbacks!) {
            this._callbacks![cb](value, this)
        }
        this.v = [value]
    }
    connect(input: AriNodeInput) {
        this._on((value) => { input.set(value) })
    }

}

//*****************************************************************************
export class AriNodeBase {
    private static _nextUniqueReqId = 1
    // IAriNodeBase reservations
    __parent: AriNodeBase | null
    name: string
    children?: { [name: string]: AriNodeBase } // Child-nodes in exposed node tree
    ins?: { [name: string]: AriNodeInput }     // Inputs exposed to public
    outs?: { [name: string]: AriNodeOutput }   // Outputs exposed to public
    calls?: { [name: string]: (args: any) => Promise<any> }    // Function calls exposed to public
    internal?: { [name: string]: any }         // Used for internal stuff.. Included when getting/setting state

    constructor(parent: AriNodeBase | null, name: string, config: INodeConfig = {}) {
        this.__parent = parent
        this.name = name
        if (parent) {
            parent.children = parent.children || {}
            parent.children[name] = this
        }
    }

    //-------------------------------------------------------------------------
    // Child care
    hasChild(name: string): boolean {
        if (this.children && name in this.children) return true
        else return false
    }
    addChild(child: AriNodeBase): AriNodeBase {
        this.children = this.children || {}
        this.children[child.name] = child
        child.__parent = this
        return child
    }
    getChild(name: string): AriNodeBase | undefined {
        if (this.children) return this.children[name]
        else return undefined
    }
    getOrCreateChild(name: string): AriNodeBase {
        let child = this.getChild(name)
        if (!child) child = this.addChild(new AriNodeBase(this, name))
        return child
    }
    getOrCreateChildPath(path: string | string[]): AriNodeBase {
        if (typeof (path) == "string") path = path.split(".")
        let pathIdx = 0
        let child: AriNodeBase = this
        while (pathIdx < path.length) {
            if (!(child.children) || !(child.children[path[pathIdx]])) child.addChild(new AriNodeBase(this, path[pathIdx]))
            child = this.children![path[pathIdx]]
            pathIdx++
        }
        return child
    }
    define(definition: any) {
        for (let prop in definition) {
            if (prop == "ins") {
                for (let i in definition.ins) {
                    this.addInput(i, definition.type)
                }
            }
        }
    }

    /** Find child nodes
     * @returns array of matching nodes, or empty array of none are found */
    findNodes(path: string | string[], maxNodes: number = Number.MAX_SAFE_INTEGER, startNode: AriNodeBase = this, nodes: AriNodeBase[] = [], pathIndex = 0): AriNodeBase[] {
        if (typeof (path) == "string") path = path.split(".")
        if (!(this.children)) return []
        for (let name in startNode.children!) {
            if (this.match(path[pathIndex], name)) {
                nodes.push(this)
                if (pathIndex < path.length - 1) return this.findNodes(path, maxNodes, startNode.children![path[pathIndex]], nodes, pathIndex++)
                else return nodes
            }
        }
        return nodes
    }
    findNode(path: string | string[]): AriNodeBase | undefined {
        return this.findNodes(path, 1)[0]
    }

    /** Simple matching func. for now! */
    match(pattern: string, target: string) {
        //console.log("match:", pattern, target)
        if (pattern.startsWith("*")) return true
        else if (pattern == target) return true
        else return false
    }


    //-------------------------------------------------------------------------
    // Inputs
    addInput(name: string, type: string, callback: ((value: any, input: AriNodeInput) => void) | null = null): AriNodeInput {
        let input = new AriNodeInput(this, name, type, callback)
        if (!this.ins) this.ins = {}
        this.ins[name] = input
        // TODO: Handle addition in subscription tree
        return input
    }

    //-------------------------------------------------------------------------
    // Outputs
    addOutput(name: string, type: string, defaultValue: any = undefined): AriNodeOutput {
        let output = new AriNodeOutput(this, name, defaultValue)
        if (!this.outs) this.outs = {}
        this.outs[name] = output
        // TODO: Handle addition in subscription tree
        // TODO: Handle default value in subscription tree
        return output
    }

    //-------------------------------------------------------------------------
    // Calls
    addCall(name: string, callFunction: (args: any) => Promise<any>): void {
        // TODO: Check if provided "callback" is async/returning a Promise!
        if (!this.calls) this.calls = {}
        this.calls[name] = callFunction
        // TODO: Handle addition in subscription tree
        // TODO: Handle default value in subscription tree
    }

    //-------------------------------------------------------------------------
    // Config?
    applyConfig(config: INodeConfig) {
        if (config.ins && this.ins) {
            for (let name in config.ins) {
                if (name in this.ins) this.ins[name].set(config.ins[name])
            }
        }
        if (config.outs && this.outs) {
            for (let name in config.outs!) {
                if (name in this.outs) this.outs[name]._next(config.outs[name])
            }
        }
    }

    /**
     * @description Get current configuration/state of object tree.
     */
    getConfig(args: { recursive: boolean, config: any }) {
        var config = args.config || {}
        config.name = this.name


        config.ins = this.ins;
        config.ins = this.ins;
        if (args.recursive) {
            for (let child in this.children!) {

            }
        }
    }

    //-------------------------------------------------------------------------
    // Misc?

    // TODO: REWRITE handling children as branches!
    update(source: any, target: any = this) {
        console.log("updating:", target, "with", source)
        // Delete target members if not in source
        for (let prop in target) {
            if (!(prop in source)) delete target[prop]
        }
        // Set target members if in source
        for (let prop in source) {
            if (source[prop] instanceof AriNodeBase) {
                if (target[prop]) target[prop] = this.update(source[prop], target[prop])
                else target[prop] = this.update(source[prop], new AriNodeBase(target, prop))
            }
            else {
                if (target[prop] != source[prop]) target[prop] = source[prop]
            }
        }
        console.log("updated!:", target)
        return target;
    }
    patch(source: any, target: any = this) {
        console.log("patching:", target, "with", source)
        // Set target members if in source
        for (let prop in source) {
            if (source[prop] instanceof AriNodeBase) {
                if (target[prop]) target[prop] = this.update(source[prop], target[prop])
                else target[prop] = this.update(source[prop], new AriNodeBase(target, prop))
                //target[prop] = this.update(source[prop], target[prop] || new AriNodeBase(target, "", prop))
            }
            else {
                if (target[prop] != source[prop]) target[prop] = source[prop]
            }
        }
        console.log("updated!:", target)
        return target;
    }

    //-------------------------------------------------------------------------
    // Public interface ???
    /**@description Get output values once
     * @argument args.path: tree structure defining path(s) to recipient(s).
     * @example get({path: {o1:{outs:{out1:"*"}},o11:{outs:{out1:}}}, reqId: 1})
     * @example get({path: {o1:{"**":{outs:{"*":"*"}}}}, reqId: 2})
     * @todo Support string paths!
     */
    once(args: { path: any, reqId: number | undefined }) {
        console.log("onc2e:", args)
        args.reqId = args.reqId || AriNodeBase._nextUniqueReqId++;
        for (let childPath in args.path) {
            if (childPath == "outs") {
                if (this.outs) {
                    for (let reqOut in args.path.outs) {
                        for (let out in this.outs) {
                            if (this.match(reqOut, out)) {
                                this.notify({ reqId: args.reqId, value: { outs: { out1: this.outs[out].v } } })
                            }
                        }
                    }
                }
            }
            if (this.children) {
                for (let child in this.children) {
                    if (this.match(childPath, child)) this.children[child].once({ path: args.path[childPath], reqId: args.reqId })
                }
            }
        }
        return args.reqId
    }
    /**@description subscribe to output changes */
    subscribe(args: { path: any, reqId: number | undefined }) {
        console.log("subscribe:", args)
        args.reqId = args.reqId || AriNodeBase._nextUniqueReqId++;
        for (let childPath in args.path) {
            if (childPath == "outs") {
                if (this.outs) {
                    for (let reqOut in args.path.outs) {
                        for (let out in this.outs) {
                            if (this.match(reqOut, out)) {
                                this.outs[out].subscribe(args.reqId)
                            }
                        }
                    }
                }
            }
            if (this.children) {
                for (let child in this.children) {
                    if (this.match(childPath, child)) this.children[child].subscribe({ path: args.path[childPath], reqId: args.reqId })
                }
            }
        }
        return args.reqId
    }
    /** ### Set input */
    set(args: { path: any }) {
    }
    /** ### Notify parents about subscribed changes.
     * Call on parent object to transfer reply back to requester. When handled, stop propagating/sending to parent!
     * Always returning array, to allow for batch transfers of changes.
     */
    notify(args: { reqId: number, value: any }) {
        if (this.__parent) {
            let value: any = { children: {} }
            value.children[this.name] = args.value
            this.__parent.notify({ reqId: args.reqId, value: value })
        }
    }
    call(args: { path: any, reqId: number, callArgs: any }) {

    }
    return(args: { reqId: number, result: any, err?: string }) {

    }
    getTypeInfo(args: { path: any, reqId: number }) {

    }



    //----------------------------------------
    // Handle events from parent to children++
    // __sinkHandlers: { [eventName: string]: ((event: IAriSinkEvent) => any)[] } = {}
    // _onSink(eventName: string, cb: (event: IAriSinkEvent) => IAriSinkResponse) {
    //     if (!(eventName in this.__sinkHandlers)) this.__sinkHandlers[eventName] = []
    //     this.__sinkHandlers[eventName].push(cb)
    // }
    // _offSink(eventName: string, cb: (event: IAriSinkEvent) => IAriSinkResponse) {
    //     this.__sinkHandlers[eventName].filter(item => item !== cb)
    // }
    // sink(event: IAriSinkEvent): IAriSinkResponse | void {
    //     if (event.name in this.__sinkHandlers) this.__sinkHandlers[event.name].forEach(cb => cb(event))
    // }

    //----------------------------------------
    // Handle event from child to parent++
    // __bubbleHandlers: { [eventName: string]: ((event: IAriBubbleEvent) => any)[] } = {}
    // _onBubble(eventName: string, cb: (event: IAriBubbleEvent) => IAriBubbleResponse) {
    //     if (!(eventName in this.__bubbleHandlers)) this.__bubbleHandlers[eventName] = []
    //     this.__bubbleHandlers[eventName].push(cb)
    // }
    // _offBubble(eventName: string, cb: (event: IAriBubbleEvent) => IAriBubbleResponse) {
    //     this.__bubbleHandlers[eventName].filter(item => item !== cb)
    // }
    // bubble(event: IAriBubbleEvent) {
    //     if (event.name in this.__bubbleHandlers) this.__bubbleHandlers[event.name].forEach(cb => cb(event))
    //     if (this.__parent) this.__parent.bubble(event)
    // }
}


// class AriInput {
//     atts: { name: string = "" }
// }

// let node = {
//     id: 0,
//     ins: [1, 2],
//     outs: [3],
//     calls: [4],
//     atts: [5, 6, 7, 8],
//     parent: null,
//     children: [10]
// }

// let nodes = []

// let in1Type = {

// }

// interface IVid {
//     v: any,
//     ts?: string
// }
// interface IVidList {
//     [vid: string]: IVid
// }
// let localVids: IVidList = {
//     $1: { v: { zoom: 1, cx: 0, cy: 0 }, ts: "" },
//     $2: { v: "" },
//     $3: { v: [] }
// }

// let root = {
//     _id: "o0",
//     _parent: null,
//     tags: {
//         name: "Node0",
//         description: "...",
//         _graphInfo: { vid: "$1", ref: null },
//         _graphInfo2: { vid: "$1", v: { zoom: 1, cx: 0, cy: 0 }, ts: "" }
//     },
//     outs: [
//         {
//             name: "out1",
//             type: "number",
//             description: "...",
//             min: 0,
//             max: 100,
//             v: 42
//         }
//     ],
//     children: "$3"
// }
// let client = {
//     _id: "v67it76vtt6vi76tv"
// }
// sub("v67it76vtt6vi76tv.0:outs.out1.v")
// sub("v67it76vtt6vi76tv.0:outs.out1.v")
// sub("HueGW.Lamps.Lamp0:outs.brightness.v", (v: number) => { return v })
// getObjectInfo("HueGW")
// let result1 = { name: "HueGW", children: ["Lamps"] }
// getObjectInfo("HueGW.Lamps")
// let result2 = { name: "Lamps", children: ["Lamp0"] }
// getObjectInfo("HueGW.Lamps.Lamp0")
// let result3 = { name: "Lamp0", outs: { brightness: { v: 42 } } }


// interface syncValue {
//     id: string,
//     v: any,
//     ts: Date
// }

// interface syncOutput extends syncValue {
//     name: syncValue
// }

// let obj = {
//     _id: 0,
//     name: { vid: "vid0", v: "root" },

// }




// let obj2 = {
//     children: { [name: string]: any }
// }

// set("12.123.i1", 42)
// on("12.123.o1", (v) => { })
// call("12.123.Call1", { arg1: "Hey!" })

// set("HueGW.Lamps.Lamp1:ins.brightness", 42)
// sub("HueGW.Lamps.Lamp1:outs.brightness", () => { })

// set("2:tags.name", "LivingroomLamp1")
// sub("HueGW.Lamps.LivingroomLamp1:outs.brightness", () => { })


// let localInfo: any = []
// subObj("HueGW", (info) => {
//     localInfo["HueGW"] = info
//     localInfo["HueGW"] = {
//         _oid: 0,
//         _parent: null,
//         config: {
//         },
//         name: {
//             description: "Given name of node. This name can be used if targeting nodes by their path names.",
//         },
//         ins: {
//             gatewayIp: { description: "<IP address:port> of the Hue gateway to connect to.", type: "string" },
//             reset: { description: "If set to true, reset the gateway.", type: "boolean" }
//         },
//         out: {
//             connected: { description: "True if connected to gateway.", type: "boolean" }
//         },
//         calls: {
//             call1: { description: "" }
//         },
//         children: [0], // Array of children sub-oids (Might not be continuous if sub-objects were ever deleted!)
//     }
// })

// subObj([0, 0] or "HueGW.Lamps", (info) => {
//     localInfo["HueGW"].children[1] = info
//     localInfo["HueGW.Lamps"] = {
//         _oid: 1,
//         _parent: 0,
//         config: {
//             name: { v: "Lamps" /* Value from subscription! */ },
//             children: [0, 1, 3]
//         }
//     })

// subObj("HueGW.Lamps.Lamp1", (info) => {
//     localInfo["HueGW.Lamps.Lamp1"] = info
//     localInfo["HueGW.Lamps.Lamp1"] = {
//         _oid: 2,
//         _parent: 1,
//         config: {
//             __subs: [],
//             name: { v: "Lamp1" /* Value from subscription! */ },
//             _graphnodeInfo: {
//                 v: { /* Value from subscription to "<HueGW_cuid>.2:config._graphnodeInfo" */
//                     x: 0,
//                     y: 0,
//                     inputSources: {
//                         gatewayIP: { v: "192.168.1.111" },
//                         reset: { sibling_oid: "1:outs.button" }
//                     }
//                 }
//             }
//         },
//         ins: {
//             brightness: { description: "", type: "number", min: 0, max: 1 }
//         },
//         out: {
//             brightness: { description: "", type: "number", min: 0, max: 1 }
//         },
//     }
// })

// // Metadata
// pub("users.123", { name: "MiX", role: "admin" })
// pub("adapters.HueGW.Lamps.Lamp1:$nodeInfo", { ins: { IP: { description: "IP:port of gateway.", type: "string" } }, outs: { connected: { desription: "True if connected to gateway." } } })

// sub("HueGW.Lamps.Lamp1:$nodeInfo", () => { })
// sub("HueGW.Lamps.Lamp1:$nodeInfo", () => { })

// pub("adpters.HueGW:children", ["Lamps"])
// pub("adpters.HueGW:$nodeInfo", { children: ["Lamps"] })

// pub("adpters.HueGW:children", ["Lamps"])
// pub("adpters.HueGW:ins", ["IP:port"])


// onCall("$HueGW.calls.reset", () => { doReset() })
// call("$HueGW.calls.reset", {})




// // OK 
// pub("HueGW.Lamps.Lamp1:outs.brightness.v", 42)
// sub("HueGW.Lamps.Lamp1:outs.brightness.v")   // = {42}

// // ??
// pub("HueGW.Lamps.Lamp1:brightness", { v: 42, ts: "" })
// sub("HueGW.Lamps.Lamp1:brightness")     // = {v:42,ts:""}



// export class AriClientSyncField {
//     static nextFID = 0  // Next unused field id. (Increment on use!)
//     _fid: number

// }


// export class AriClientSyncObject {
//     __syncClient: AriSyncClient
//     _oid: number
//     children?: {}
//     constructor(syncClient: AriSyncClient) {
//         this._oid = syncClient.getOID()
//     }
//     addObject() {
//         if (!("children" in this)) this.children = {}
//     }
// }

// export class AriSyncClient {
//     private nextOID = 1  // Next unused id. (Increment on use!)
//     private nextFID = 1  // Next unused id. (Increment on use!)
//     private OIDs: { [oid: number]: AriClientSyncObject } = {}
//     constructor(name: string) {
//         // TODO: Add name config
//         var self = this
//         let p: any = new Proxy({ config: { name } }, {
//             get: function (target: any, prop: string | number | symbol, receiver: any) {
//                 console.log("! getTrap", target, prop, receiver)
//                 return target[prop]
//             },
//             set(target: any, prop: string | number | symbol, value: any, receiver: any) {
//                 console.log("! setTrap", target, prop, receiver)
//                 target[prop] = value
//                 return true
//             }
//         })
//         return p
//     }
//     getOID() {
//         return this.nextOID++
//     }
//     getFID() {
//         return this.nextFID++
//     }
//     // Send to server
//     onSend: (msg: any) => void
//     //receive from server
//     receive(msg: any) {
//     }
//     // Persist state of this object
//     getState(): any {
//         return { v: this.value }
//     }
//     // Restore persisted state of this object
//     setState(state: any): boolean {
//         return true
//     }
// }

// class HueGW extends AriSyncClient {
//     constructor() {
//         super("HueGW")
//     }
// }

// let hueGW = new HueGW()

