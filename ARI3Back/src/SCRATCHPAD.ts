import { AriClientServer } from "./AriClientServer";

export class SyncElement {
    __eid: number
    __type: string
    __v: any
    __parent: SyncElement | SyncService
    __subs: ((element: SyncElement, value: any) => void)[]    // Callback functions to be called on change.
    constructor(parent: SyncElement | SyncService, typeName: string) {
        this.__parent = parent
        this.__type = typeName
    }
    __getClient(): SyncService {
        let parent = this
        while (parent) {
            // console.log("..", parent)
            if (parent instanceof SyncService) break
            parent = parent.__parent
        }
        return parent
    }
    sub(cb: (element: SyncElement, value: any) => void) {
        this.__subs = this.__subs || {}
        this.__subs.push(cb)
        cb(this, this.__getValue())
    }
    unsub(cb: (element: SyncElement, value: any) => void) {
        if (this.__subs) {
            if (this.__subs[name]) {
                let i = this.__subs[name].indexOf(cb)
                if (i) this.__subs[name].splice(i, 1)
            }
        }
    }
    protected __notifyChanged() {
        if (this.__subs) {
            this.__subs.forEach(cb => {
                console.log("EID:", this.__eid, "=", this.v)
                cb(this, this.v)
            })
        }
    }
    get v() {
        return this.__v
    }
    set v(value) {
        this.__v = value
        this.__notifyChanged()
    }
    __getInfo() {
        return { eid: this.__eid, t: this.__type }
    }
}

// ----------------------------------------------------------------------------
export class SyncObject extends SyncElement {
    [name: string]: SyncObject | any    // Prevent TS errors!
    constructor(parent: SyncElement | SyncService) {
        super(parent, "SyncObject")
        this.__v = {}
        var self = this
        let p = new Proxy(this, {
            set: function (target, prop: string, value, receiver) {
                // console.log("!! set - T:", target, "P:", prop, "V:", value)
                target[prop] = value
                if (prop.startsWith("__")) return true
                if (typeof (value) == "object") {
                    if (value instanceof SyncElement) {
                        if (target instanceof SyncElement) {
                            // Find root SyncClient
                            let client = target.__getClient()
                            // Add this SyncElement to the SyncClients handled objects.
                            value.__eid = client.getEID()
                            client.__elements[value.__eid] = value
                            target.__notifyChanged()
                        }
                    }
                } else {
                    target.__notifyValueChanged(prop)
                }
                return true
            }
        })
        return p
    }
    static __create(parent: SyncElement, state: any) {
        // tate = { eid: 0, t: 'SyncObject', v: [ brightness: 4 ] }
        // {eid:0, t:"SyncObject", v:{Lamps:{eid:1, t:"SyncObject", v:{Lamp1":{…

        let so = new SyncObject(parent)
        so.__eid = state.eid || so.__getClient().getEID()
        for (let prop in state.v) {
            if (o[prop].t SyncService.createType
        }
        so.v = state.v
        return so
    }
    __notifyChanged() {
        console.log("NOTIFYCHANGE! T:")
        let change = { eid: this.__eid, v: {} }
        for (let prop in this) {
            if (!(prop.startsWith("__"))) change.v[prop] = this[prop].__eid
        }
        console.log(JSON.stringify(change, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))
    }
    __notifyValueChanged(prop: string) {
        console.log("notifyVALUEchange!")
        let change = { eid: this.__eid, v: {} }
        if (!(prop.startsWith("__"))) change.v[prop] = this[prop]
        console.log(JSON.stringify(change, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))
    }
    __getValue() {
        let v = {}
        for (let prop in this) {
            if (!(prop.startsWith("__"))) {
                v[prop] = this[prop].__eid
            }
        }
        return v
    }
    __getInfo() {
        let info = super.__getInfo()
        info.v = this.__getValue("**")
        return info
    }
}

// ----------------------------------------------------------------------------
export class SyncService {
    [name: string]: SyncObject | any    // Prevent TS errors!

    //-----------------------
    static SyncElementTypes: { [typeName: string]: (parent: SyncElement, state: any) => SyncElement } = {}
    static registerType(typeName: string, factory: (parent: SyncElement, state: any) => SyncElement) {
        SyncService.SyncElementTypes[typeName] = factory
    }
    static createType(parent: SyncElement, args: any): SyncElement {
        let se
        if (!args.t) {
            if (SyncService.SyncElementTypes[args.t]) se = SyncService.SyncElementTypes[args.t](parent, args)
        } else {
            console.log("Creation of unknown type requested. Falling back to generic object type!")
            se = SyncObject.__create(parent, args)
        }
        return se
    }

    //-----------------------
    private __nextEid = 0
    public __elements: { [eid: number]: SyncElement } = {}
    getEID() {
        // console.log("GetEID:", this.__nextEid, this)
        return this.__nextEid++
    }

    //-----------------------
    constructor() {
        this.__cid = 1234567890

        // PreRegister some stanard types
        SyncService.registerType("SyncObject", SyncObject.__create)



        let p = new Proxy(this, {
            set: function (target, prop: string, value, receiver) {
                // console.log("!! set - T:", target, "P:", prop, "V:", value)
                target[prop] = value
                if (prop.startsWith("__")) return true
                if (value instanceof SyncElement) {
                    value.__eid = target.getEID()
                    value.__parent = target
                    target.__elements[value.__eid] = value
                    target.__notifyChange()
                }
                // Idea of being able to set via normal object tree - convert to syncobject tree!
                if (typeof (value) == "object") {
                    // Add as SyncObject
                    if (!value.__type) target[prop] = new SyncObject(target)
                    else target[prop] = SyncService.createType(value.__type, value)
                    for (let p in value) {
                        target[prop][p] = value[p]
                    }
                }
                return true
            }
        })
        return p
    }
    // Notify listeners of change
    __notifyChange() {
        console.log("Client NOTIFYCHANGE! T:")
        let change = { cid: this.__cid, v: {} }
        for (let prop in this.__elements) {
            if (!(prop.startsWith("__"))) change.v[prop] = this.__elements[prop].__eid
        }
        console.log(JSON.stringify(change, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))
    }
    // Receive change from source
    __handleChange(eid: number, msg: any) {
        // Send to client
    }

    // Client interface
    // Subscribe(subscriptionObject: any, cb?)
    // TODO:

    // Unsubscribe
    // TODO: 

    onUpdate(subscriptionObject: any) {

    }

    // getInfo(eid: number)
    // TODO:



}

// ----------------------------------------------------------------------------
class AriSyncNode extends SyncObject {
    ins?: SyncObject
    outs?: SyncObject
    tags?: SyncObject
    children?: SyncObject
    constructor(parent: SyncElement | SyncService) {
        super(parent)
    }
    addIn(name: string, tags: any) {
        if (!this.ins) this.ins = new SyncObject(this)
        this.ins[name] = new SyncObject(this.ins)
        // this.ins[name] = new SyncVar(value)
    }
    addChild(child: SyncElement) {

    }
}

// ----------------------------------------------------------------------------
class HueGW extends SyncObject {
    ins?: SyncObject
    outs?: SyncObject
    tags?: SyncObject
    children?: SyncObject
    constructor(parent: SyncElement | SyncService) {
        super(parent)
        this.addIn("IP", { "desciption": "...", v: "192.168.1.101" })
        this.children = new SyncObject(this)
    }
}

// ----------------------------------------------------------------------------
export class AriSyncApp {//extends SyncService {
    root: any
    //hueGW: AriSyncNode
    constructor() {
        // super()

        console.log("********************************************************************************")
        // this.root = new SyncObject()
        // this.root.i = new SyncObject()
        // this.HueGW = new HueGW(this)

        // this.HueGW = {
        //     eid: 0, t: "SyncObject", v: {
        //         tags: {
        //             eid: 1, t: "SyncObject", v: {
        //                 description: { eid: 2, t: "SyncValue", v: "Philips HUE gateway." }
        //             }
        //         },
        //         "children": {
        //             eid: 1, t: "SyncObject", v: {
        //                 "Lamps": {
        //                     eid: 1, t: "SyncObject", v: {
        //                         "tags": {
        //                             eid: 1, t: "SyncObject", v: {
        //                                 description: {
        //                                     eid: 1, t: "SyncVar",
        //                                     v: "..."
        //                                 }
        //                             }
        //                         },
        //                         "children": {
        //                             eid: 1, t: "SyncObject", v: {
        //                                 "Lamp1": {
        //                                     eid: 1, t: "SyncObject", v: {
        //                                         "tags": {
        //                                             eid: 1, t: "SyncObject", v: {
        //                                                 "description": { eid: 1, t: "SyncVar", v: "..." }
        //                                             }
        //                                         },
        //                                         "ins": {
        //                                             eid: 1, t: "SyncObject", v: {
        //                                                 "brightness": {
        //                                                     eid: 1, t: "SyncObject", v: {
        //                                                         "description": { eid: 1, t: "SyncVar", v: "..." },
        //                                                         "v": { eid: 1, t: "SyncVar", v: 0.42 }
        //                                                     }
        //                                                 }
        //                                             }
        //                                         }
        //                                     }
        //                                 }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        //} 
        // this.HueGW = {
        //     __eid: 0, __t: "SyncObject",
        //     tags: {
        //         __eid: 0, __t: "SyncObject",
        //         description: { __eid: 0, __t: "SyncObject", v: "Philips HUE gateway." }
        //     },
        //     "children": {
        //         __eid: 0, __t: "SyncObject",
        //         "Lamps": {
        //             __eid: 0, __t: "SyncObject",
        //             "tags": {
        //                 __eid: 0, __t: "SyncObject",
        //                 description: {
        //                     __eid: 0, __t: "SyncObject",
        //                     v: "..."
        //                 }
        //             }
        //         },
        //         "children": {
        //             __eid: 0, __t: "SyncObject",
        //             "Lamp1": {
        //                 __eid: 0, __t: "SyncObject",
        //                 "tags": {
        //                     __eid: 0, __t: "SyncObject",
        //                     "description": { __eid: 0, __t: "SyncObject", v: "..." }
        //                 }
        //             },
        //             "ins": {
        //                 __eid: 0, __t: "SyncObject",
        //                 "brightness": {
        //                     __eid: 0, __t: "SyncObject",
        //                     "description": { __eid: 0, __t: "SyncVar", v: "..." },
        //                     "v": { __eid: 0, __t: "SyncVar", v: 0.42 }
        //                 }
        //             }
        //         }
        //     }
        // }

        // console.log("-----------------------")
        // console.log("Elements:\n", this.__elements)
        // console.log("Elements:\n", JSON.stringify(this.__elements, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))
        // console.log("SyncApp", this)
        // console.log("SyncApp", JSON.stringify(this, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))

        // console.log("ELEMENTS")
        // for (let e in this.__elements) {
        //     console.log(this.__elements[e].__getInfo())
        // }




        // console.log("SyncApp", JSON.stringify(SNode.oids, null, 2))

        // let hueGW = new ANode("HueGW", { tags: { description: "..." } })
        // let Lamps = hueGW.addNode("Lamps", { tags: { description: "..." } })
        // let Lamp1 = Lamps.addNode("Lamp1", { tags: { description: "..." } })
        // Lamp1.outs.add("brightness", { description: "...", v: 0 })
        // Lamp1.ins.add("brightness", {}, (value: any, subObj: any) => {
        //     if (value > 0) Lamp1.outs.brightness = 1
        // })

        // send({ oid: 0, v: { HueGW: 1 } })               // HueGW
        // send({ oid: 1, v: { Lamps: 2 } })               //   Lamps
        // send({ oid: 2, v: { Lamp1: 3, Lamp2: 4 } })     //     Lamp1
        // send({ oid: 3, v: { ins: 5 } })                 //       ins
        // send({ oid: 5, v: { brightness: 6 } })          //         brightness
        // send({ oid: 6, v: { description: 7, v: 8 } })   //           description
        // send({ oid: 7, v: ".." })                       //             "..."
        //                                                 //           v
        // send({ oid: 8, v: 0.43 })                       //             0.43
        //                                                 //     Lamp2
        // send({ oid: 4, v: { ins: 9 } })                 //       ins
        // send({ oid: 9, v: { brightness: 10 } })         //         brightness
        // send({ oid: 10, v: { description: 11, v: 12 } })//           description
        // send({ oid: 11, v: "..." })                     //             "..."
        //                                                 //           v
        // send({ oid: 12, v: 0.42 })                      //             0.42
        // class AriIns {
        //     __parent: AriNode
        //     constructor(parent: AriNode) {
        //         this.__parent = parent
        //     }
        //     add(name: string, cb: (value: any) => void) {

        //     }
        // }
        // class AriChildren {
        //     // [name: string]: AriNode
        //     __parent: AriNode
        //     constructor(parent: AriNode) {
        //         this.__parent = parent
        //     }
        //     add(name: string) {
        //         let child = new AriNode(this.__parent)
        //         this.__parent.children[name] = 
        //     }
        // }
        class AriNode {
            __parent: AriNode | null
            __id: number
            ins?: AriIns
            children?: AriChildren
            constructor(parent: AriNode | null) {
                this.__parent = parent
                if (this.__parent) {
                    this.__id = this.__parent.getAOId()
                }
                let p = new Proxy(this, {
                    get: function (target, prop) {
                        if (prop = "ins") {
                            this.ins = this.ins || new AriIns(this)
                            return this.ins
                        } else if (prop = "children") {
                            this.children = this.children || new AriChildren(this)
                            return this.children
                        }
                    }
                })
                return p
            }
            setDefaultState() {
                // Overwrite in sub-class to define default state for node.
            }
            setState(state: any) {
                if (state.ins) this.ins = new AriIns(state.ins)
                if (state.outs) this.outs = new AriOuts(state.outs)
                if (state.calls) this.calls = new AriCalls(state.calls)
                if (state.children) this.children = new AriChildren(state.children)
            }
            getState() {
                return JSON.stringify(this)
            }
        }
        class FunctionNode extends AriNode {
            constructor(state: any) {
                super(state)
                if(ins._initCode) eval(ins._initCode.v)
            }
        }
        class Ticker extends AriNode {
            constructor(state: any) {
                super(state)
            }
            setDefaultState() {
                this.setState({
                    ins: {
                        interval: {
                            description: "",
                            type: "number",
                            default: 1000
                        },
                        enable: {
                            description: "",
                            type: "boolean",
                            default: true
                        }
                    },
                    outs: {
                        tick: {
                            description: "",
                            v: 42
                        }
                    }
                })
            }
        }
    }
// class AriClient extends AriNode{
//     name: string
//     private nextAOId = 1
//     getAOId() {
//         return this.nextAOId++
//     }
//     constructor(name: string){
//         super(null)
//         this.name = name
//     }
//     addNode(name: string){
//         return new AriNode(this)
//     }
// }
// class App extends AriClient {
//     constructor(){
//         super()
//     }
// }
