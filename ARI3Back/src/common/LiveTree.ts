

/* 
    TODO: API should support "pathToValue" as parameter like:
        JSON notation e.g. an object like sub({Devices:{device1:{property1:value}}}, ...)
        dot-delimeted string  e.g. "Devices.device1.property1"
        API should also be reachable by code (possibly proxy object traversing to target object)
            E.g. root.Devices.device1.property1.sub(()=>{...})

 
// IDEA: Handling of event-TREES's!???
    // Another idea: wildcards in JSON with events for subscription?
    sub = { devices: { "**": { "*": "*" } } }   // Subscribe to all child objects of "devices" where any member has any value
    sub2 = { devices: { "433GW": { "*": "*" } } }   // Subscribe to all direct members of "devices.433GW"
    event3 = { cmd: "sub", path: { devices: { "*": { "*": "*" } } } }   // Subscribe to all direct children 
    reqEvent4 = { re1: 1, cmd: "get", path: { devices: { "**": { "*": "*" } } } }   // Subscribe to all properties for all direct or indirect children of "devices"
    resEvent4 = { res: 1, path: { devices: { "**": { "*": "*" } } } }   // Subscribe to all properties for all direct or indirect children of "devices"



*/



export class LiveTree {
    root: any
    subscriptionTree = {}
    nextSubId = 0
    constructor(target: any) {
        this.root = target || {}
    }
    match(patternTree: any, cb: (obj: object, prop: any) => any, targetTree: any = this.root, matchTree: any = {}) {
        for (let targetProp in patternTree) {
            if (typeof patternTree[targetProp] == "object") {
                //console.log("-> Check", matchProp);
                // Match objects
                if (targetProp == "**") {
                    for (let targetProp in targetTree) {
                        if (typeof targetTree[targetProp] == "object") {
                            cb(targetTree, targetProp)
                            this.getSubTree(
                                patternTree[targetProp],
                                targetTree[targetProp],
                                matchTree[targetProp]
                            );
                        }
                    }
                } else {
                    if (targetProp in targetTree) {
                        if (typeof targetTree[targetProp] == "object") {
                            cb(targetTree, targetProp)
                            this.getSubTree(
                                patternTree[targetProp],
                                targetTree[targetProp],
                                matchTree[targetProp]
                            );
                        }
                    }
                }
            } else {
                // Match members
                //console.log("MEMBER!");
                if (targetProp == "*") {
                    for (let targetProp in targetTree) {
                        if (typeof targetTree[targetProp] != "object") cb(targetTree, targetProp)
                    }
                } else {
                    if (targetProp in targetTree) {
                        if (typeof targetTree[targetProp] != "object") cb(targetTree, targetProp)
                    }
                }
            }
        }
        return matchTree;
    }
    getSubTree(patternTree: any, targetTree: any = this.root, matchTree: any = {}) {
        for (let matchProp in patternTree) {
            if (typeof patternTree[matchProp] == "object") {
                //console.log("-> Check", matchProp);
                // Match objects
                if (matchProp == "**") {
                    for (let destProp in targetTree) {
                        if (typeof targetTree[destProp] == "object") {
                            matchTree[destProp] = {};
                            this.getSubTree(
                                patternTree[matchProp],
                                targetTree[destProp],
                                matchTree[destProp]
                            );
                        }
                    }
                } else {
                    if (matchProp in targetTree) {
                        if (typeof targetTree[matchProp] == "object") {
                            matchTree[matchProp] = {};
                            this.getSubTree(
                                patternTree[matchProp],
                                targetTree[matchProp],
                                matchTree[matchProp]
                            );
                        }
                    }
                }
            } else {
                // Match members
                //console.log("MEMBER!");
                if (matchProp == "*") {
                    for (let destProp in targetTree) {
                        if (typeof targetTree[destProp] != "object")
                            matchTree[destProp] = targetTree[destProp];
                    }
                } else {
                    if (matchProp in targetTree) {
                        if (typeof targetTree[matchProp] != "object")
                            matchTree[matchProp] = targetTree[matchProp];
                    }
                }
            }
        }
        return matchTree;
    }
    subscribe(patternTree: any, cb: (subId: number, updateTree: any, deletedTree: any) => void, subId?: number): number {
        subId = subId || this.nextSubId++
        
        return subId
    }
    /**
     * Set value (persisting last "state")
     * @example set("ari.log", "LogEntry!") 
    */
    set(path: string | string[], value: any) {
        if (typeof (path) == "string") path = path.split(".")
    }
    /**
     * Emit event (NOT persisting last "state")
     * @example emit("ari.log", "LogEntry!") 
    */
    emit(path: string | string[], value: any) {
        if (typeof (path) == "string") path = path.split(".")
    }
    /**
     * Log a change (persisting all last "states")
     * @example emit("ari.log", "LogEntry!") 
    */
    next(path: string | string[], value: any) {
        if (typeof (path) == "string") path = path.split(".")
    }
}




// class AriConfigs {
//     constructor() {

//     }
//     set(name: string, value: any) {

//     }
//     get(name: string) {

//     }
//     sub(name: string, subObj: any, cb: () => void) {

//     }
//     _setState() {
//     }
//     _getState() {
//     }
// }

// class AriIns {
//     constructor() {

//     }
//     add(name: string, state?: any, cb?: () => void) {

//     }
//     _setState() {
//     }
//     _getState() {
//     }
// }

// class AriOuts {
//     constructor() {

//     }
//     add(name: string, state?: any) {

//     }
//     _setState() {
//     }
//     _getState() {
//     }
// }

// export class AriClientSyncObject {
//     __syncClient: AriSyncClient | null
//     _oid?: string
//     ins?: AriIns
//     outs?: AriOuts
//     config?: { [name: string]: any }

//     children?: { [name: string]: AriClientSyncObject }

//     constructor(syncClient: AriSyncClient | null, name: string, state: any) {
//         if (syncClient) {
//             this.__syncClient = syncClient
//             this._oid = syncClient.getOID()
//         }
//         this.config = { name }
//     }
//     addChild(name: string, state?: any) {
//         let c = new AriClientSyncObject(this.__syncClient, name, state)
//         this.children = this.children || {}
//         this.children[name] = c
//         return c
//     }
//     addIn(name: string, state: any, cb: () => void) {
//         this.ins = this.ins || new AriIns()
//         this.ins.add(name, state, cb)
//     }
//     addOut(name: string, state: any) {
//         this.outs = this.outs || new AriOuts()
//         this.outs.add(name, state)
//     }

//     // Persist state of this object
//     _getState(): any {
//         let state: any = {}
//         if (this.config) state.config = this.config._getState()
//         if (this.ins) state.ins = this.ins._getState()
//         if (this.outs) state.outs = this.outs._getState()
//         return state
//     }
//     // Restore persisted state of this object
//     _setState(state: any): boolean {
//         return true
//     }
// }

// export class AriSyncClient extends AriClientSyncObject {
//     private __nextOID = 1  // Next unused id. (Increment on use!)
//     private __nextFID = 1  // Next unused id. (Increment on use!)
//     private _OIDs: { [oid: number]: AriClientSyncObject } = {}
//     _cid: string

//     constructor(name: string, state?: any) {
//         super(null, name, state)
//         if (!state) state = this
//         state.config = { name }
//         return state
//     }

//     getOID() {
//         return String(this.__nextOID++)
//     }
//     getFID() {
//         return String(this.__nextFID++)
//     }

//     // Persist state of this object
//     _getState(): any {
//         return {}
//     }
//     // Restore persisted state of this object
//     _setState(state: any): boolean {
//         return true
//     }

//     // Send to server
//     __onSend: (msg: any) => void
//     //receive from server
//     __receive(msg: any) {
//     }
// }

// class pubsupper {
//     topics: {[topic:string]: {value: any, cbs:((topic: string, v: any)=>void)[]}} = {}
//     pub(topic: string, value: any) {
//         if(!(this.topics[topic])) this.topics[topic] = {value, cbs:[]}
//         else this.topics[topic].value = value
//     }
//     sub(topic: string, cb: (topic: string, v: any) => void) {
//         if(!(this.topics[topic])) this.topics[topic] = {value:undefined, cbs:[]}
//         console.log("Adding CB:", cb)
//         this.topics[topic].cbs.push(cb)
//         console.log("CBs:", this.topics[topic].cbs)
//         if(this.topics[topic].value) cb(topic, this.topics[topic].value)
//     }
// }

// class PubSubNode {
//     static nextTID = 1
//     private _tid: number
//     private _topic: string
//     private _value?: any
//     private _cbs?:((topic: string, v: any)=>void)[]
//     private _subTopics: {[name: string]: PubSubNode}

//     constructor(topic: string){
//         this._topic = topic
//         this._tid = PubSubNode.nextTID++
//     }

//     pub(path: string | string[], value: any) {
//         path = typeof(path) == "string" ? path.split(".") : path
//         console.log("Pubbing:", path)
//         let t = this.getTopic(path)
//         t._value = value

//         // if(path.length) {
//         //     if(!this._subTopics) this._subTopics = {}
//         //     let subPath = path[0]
//         //     if(!(subPath in this._subTopics)) this._subTopics[subPath] = new PubSubNode(subPath)
//         //     path.shift()
//         //     this._subTopics[subPath].pub(path, value)
//         // } else {
//         //     this._topic = path[0]
//         //     this._value = value
//         // }
//         return t
//     }
//     sub(path: string | string[], cb: (topic: string, v: any) => void) {
//         path = typeof(path) == "string" ? path.split(".") : path
//         console.log("Subbing:", path)
//         let t = this.getTopic(path)

//         console.log("Adding CB:", cb)
//         if(!this._cbs) this._cbs = []
//         this._cbs.push(cb)
//         console.log("CBs:", this._cbs)

//         return t

//         // if(path.length) {
//         //     if(!this._subTopics) this._subTopics = {}
//         //     let subPath = path[0]
//         //     if(!(subPath in this._subTopics)) this._subTopics[subPath] = new PubSubNode(subPath)
//         //     path.shift()
//         //     this._subTopics[path[0]].sub(path, cb)
//         // } else {
//         //     console.log("Adding CB:", cb)
//         //     this._topic = path[0]
//         //     if(!this._cbs) this._cbs = []
//         //     this._cbs.push(cb)
//         //     console.log("CBs:", this._cbs)
//         // }
//     }
//     getTopic(path: string | string[]): PubSubNode{
//         path = typeof(path) == "string" ? path.split(".") : path
//         console.log("Getting topic:", path)
//         if(path.length) {
//             if(!this._subTopics) this._subTopics = {}
//             let subPath = path[0]
//             if(!(subPath in this._subTopics)) this._subTopics[subPath] = new PubSubNode(subPath)
//             path.shift()
//             return this._subTopics[subPath].getTopic(path)
//         } else {
//             console.log("Found this:", this)
//             return this
//         }
//     }
//     listSubTopics(){
//         return Object.keys(this._subTopics)
//     }
// }


// export class HueGW {
//     constructor() {
//         console.log("HueGW =", JSON.stringify(this, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))

//         //let p = new pubsupper()
//         let p = new PubSubNode("root")
//         p.pub(".$", { description: "Philips HUE gateway." })
//         p.pub(".$lamps", { description: "Group for HUE lamps!..." })
//         let lamp1 = p.pub(".$lamps.$lamp1", { description: "...", outs: { brightness: {} } })
//         lamp1.pub("outs.brightness.v", 0.42)
//         lamp1.sub("ins.brightness.v", (v) => { console.log(v) })
//         console.log("SubTopics", lamp1.listSubTopics())
//         let root: any = {}
//         console.log("pubsub =", JSON.stringify(p, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))
//         console.log("root =", JSON.stringify(root, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))

//         // ----------
//         p.sub(".$lamps.$lamp1", (topic, v) => { 
//             console.log("!!!!!!!!")
//             this.patch(root, v) 
//         })

//         // ----------
//         console.log("pubsub =", JSON.stringify(p, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))
//         console.log("root =", JSON.stringify(root, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))

//         p.sub(".$lamps.$lamp1.outs.brightness.v", (topic, v) => { 
//             console.log("!!!!!!!!", topic)
//             this.patch(root.outs.brightness.v, v) 
//         })

//         // ----------
//         console.log("pubsub =", JSON.stringify(p, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))
//         console.log("root =", JSON.stringify(root, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))




//     }
//     patch(target: any, source: any) {
//         console.log("Patch: T:", target, "S:", source)
//         // Delete from target if not in source
//         for (let prop in target) {
//             if (!(prop in source)) delete target[prop]
//         }
//         // Set target if in source
//         for (let prop in source) {
//             if (!(prop in target)) target[prop] = source[prop]
//             else {
//                 if(typeof(target[prop]) == "object") this.patch(target[prop], source[prop])
//                 else if(target[prop] != source[prop]) target[prop] = source[prop]
//             }
//         }
//     }
// }



