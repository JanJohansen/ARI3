import { performance } from "perf_hooks"
var cuid = require('cuid');


const syncElementIdSym = Symbol("ARI.syncElementID")
class SyncElement {
    [syncElementIdSym]: string | number
    __$subs?: ((syncElement: SyncElement, subscriptionData: any) => void)[]

    constructor() {
        this[syncElementIdSym] = SyncProvider.getGUID()
    }

    __$getSyncState() {
        return "ERROR: Missing override of __$getSyncState()!"
    }
    __$setSyncState(state: any) {

    }
    __$handleElementUpdate() {
        SyncProvider.__handleElementUpdate(this)
    }
}
/*
Objects are stored directly in SyncProvider.elements with added syncElementIdSym property.
Scalar members E.g. values properties are converted to "SyncValue objects" storing the value.
*/
class SyncObject extends SyncElement {
    constructor() {
        super()

        // OPTIMIZE: Potential to reuse trap from this super class in derived classes.
        let p = new Proxy(this, {
            set: function (target: any, prop: string, value) {
                // console.log("!! set - T:", target, "P:", prop, "V:", value)
                // console.log("!! set - P:", prop, "V:", value)

                // Ignore non-string members and string members starting w. "__"...
                if (typeof (prop) != "string" || prop.startsWith("__")) {
                    target[prop] = value
                    return true
                }
                if (typeof (value) == "object") {
                    if (syncElementIdSym in value) {
                        // console.log("SO: SyncValue already created for value:", prop)
                        target[prop] = value   // Value object already proxied and registered. Just add current instance reference
                        target.__$handleElementUpdate()
                        return true
                        // target[prop].__$handleElementUpdate()
                    } else {
                        // console.log("SO: creating:", prop, value)
                        target[prop] = new SyncObject()
                        value[syncElementIdSym] = target[prop][syncElementIdSym]    // Verify!
                        target.__$handleElementUpdate()
                        for (let p in value) {
                            target[prop][p] = value[p]  //Recurse through members
                            target[prop].__$handleElementUpdate()
                        }
                    }
                } else { 
                    // Value is not an object!
                    if (target[prop]) {
                        if (SyncValueValueSymbol in target[prop]) {
                            // "Value object" for value exists
                            target[prop][SyncValueValueSymbol] = value
                            target[prop].__$handleElementUpdate() // Indicate updated value 
                            // target.__$handleElementUpdate() // Indicate updated value
                        } else {
                            // FIXME: Convert Object to Value!?
                            console.log("Convert???", target, prop, value)
                        }
                    }
                    else {
                        // New "value object" TBCreated
                        target[prop] = new SyncValue(value)   // Replace value w. object containign value!
                        target.__$handleElementUpdate()     // Added value to parent
                    }
                    // Member is defined on this onject

                }
                return true
            },
            get: function (target, prop: string) {
                if ((typeof (target[prop]) == "object") && (SyncValueValueSymbol in target[prop])) return target[prop][SyncValueValueSymbol]
                return target[prop]
            }
        })
        return p
    }
    on(prop, cb: () => void) {

    }
    onAny(cb: () => void) {

    }
    getState() {
        let state: any = {}
        for (let p in this) {
            if (p.startsWith("__")) continue
            if (typeof (this[p]) !== "object") state[p] = this[p]
            else if(state[p][syncElementIdSym]) state[p] = state[p].getState()
        }
        if (this.onPostNewState) this.onPostNewState
    }
    setState(state: any) {
        for (let p in state) {
            if (typeof (state[p]) !== "object") this[p] = state[p]
            else this[p].setState(state[p])
        }
    }
    onPostNewState() {

    }
    __$getSyncState() {
        let state: any = {}
        state.id = this[syncElementIdSym]
        state.v = {}
        for (let prop in this) {
            if (typeof (this[prop]) == "object" && syncElementIdSym in this[prop]) state.v[prop] = (<any>this)[prop][syncElementIdSym]
        }
        return state
    }
}

const SyncValueValueSymbol = Symbol("ARI.SyncValueValueSymbol")
class SyncValue extends SyncElement {
    [SyncValueValueSymbol]: any
    constructor(value?: any) {
        super()
        this[SyncValueValueSymbol] = value
        this.__$handleElementUpdate()
    }
    get v() { return this[SyncValueValueSymbol] }
    set v(value: any) {
        this[SyncValueValueSymbol] = value
        this.__$handleElementUpdate()
    }
    __$getSyncState() {
        let state: any = {}
        state.id = this[syncElementIdSym]
        state.v = this[SyncValueValueSymbol]
        return state
    }
}

class SyncProvider {
    private static nextGUID = 0
    static syncElements: { [id: number]: SyncElement } = {}
    static perfCount = 0
    // static root = new SyncObject()

    static getGUID() {
        // return cuid()
        return this.nextGUID++
    }
    static subscribe(elementID: number, cb: (syncElement: SyncElement, subscriptionData: any) => void) {
        let se = SyncProvider.syncElements[elementID]
        if (se) {
            se.__$subs = se.__$subs || []
            se.__$subs.push(cb)
        }
    }
    static __handleElementUpdate(syncElement: SyncElement) {
        // console.log("SyncProvider:", syncElement.__$seid, "=", JSON.stringify(syncElement.__$getSyncState(), (k, v) => { return k.startsWith("__") ? "<.>" : v }))
        if (this.syncElements[syncElement[syncElementIdSym]]) {
            // Updated value
            console.log("syncElement updated:", syncElement[syncElementIdSym], syncElement.__$getSyncState().v)
            // this.__syncObjects[syncElement[syncElementIdSym]] = syncElement
        } else {
            // New element added.
            console.log("syncElement added:", syncElement[syncElementIdSym], syncElement.__$getSyncState().v)
            this.syncElements[syncElement[syncElementIdSym]] = syncElement
        }

        this.perfCount++
        if (this.perfCount == 1000000) {
            this.perfCount = 0
            console.log("E!")
        }
    }
}
class SyncConsumer {
    constructor() {

    }
}

// ----------------------------------------------------------------------------
class AriValue extends SyncValue {
    cbs?: (() => void)[]
    get v() { return super.v }
    set v(value: any) {
        super.v = value
        if (this.cbs) {
            for (let cb of this.cbs) cb()
        }
    }
    onChange(cb: () => {}) {
        if (!this.cbs) this.cbs = []
        this.cbs.push(cb)
    }
    offChange(cb: () => {}) {
        if (!this.cbs) return
        this.cbs.splice(this.cbs.indexOf(cb), 1)
    }
}
class AriCall extends SyncElement {
}
class AriCollection<T> extends SyncObject {
    [name: string]: T | any
    constructor(type: { new(): T }) {
        super()
        // let p = new Proxy(this, {
        //     get: function (target: AriCollection<T>, prop: string) {
        //         // console.log("Coll.get:", prop)
        //         if (typeof (prop) != "string" || prop.startsWith("__")) return target[prop]

        //         if (!(prop in target)) {
        //             target[prop] = new type()    // CreateIfNotExists
        //             target.__$handleElementUpdate()
        //         }
        //         return target[prop]
        //     },
        //     set: function (target, prop, value) {
        //         if (typeof (prop) != "string" || prop.startsWith("__")) { target[prop] = value; return true }
        //         if(value[syncElementIdSym]) {
        //             // Exchange
        //             // delete target[prop]
        //             target[prop] = value[syncElementIdSym]
        //         }
        //         return true
        //     }
        // })
        // return p
    }
}
class AriNode extends SyncObject {
    ins: AriCollection<AriValue>
    outs: AriCollection<AriValue>
    tags: AriCollection<AriValue>
    calls: AriCollection<AriCall>
    _typeInfo?: any
    constructor() {
        super()

        let p = new Proxy(this, {
            get: function (target, prop) {
                if (typeof (prop) != "string" || prop.startsWith("__")) return target[prop]
                if (!(prop in target)) {
                    // CreateIfNotExists
                    if (prop == "ins") target[prop] = new AriCollection<AriValue>(AriValue)
                    else if (prop == "outs") target[prop] = new AriCollection<AriValue>(AriValue)
                    else if (prop == "tags") target[prop] = new AriCollection<AriValue>(AriValue)
                    else if (prop == "calls") target[prop] = new AriCollection<AriCall>(AriCall)

                    target.__$handleElementUpdate()
                }
                return target[prop]
            }
        })

        // FIXME: Remove eval - if possible/needed!??
        let typeInfo = eval(this.constructor.name)._typeInfo
        // console.log("TypeInfo:", typeInfo)
        if (typeInfo) {
            if (typeInfo.ins) {
                for (let name in typeInfo.ins) {
                    p.ins.set(name, typeInfo.ins[name].v)
                }
            }
        }

        return p
    }
}
class Ticker extends SyncObject {
    static _typeInfo = new AriValue({
        tags: { description: 'Object outputting DateTime.now() at a configurable interval.' },
        ins: {
            interval: { type: 'number', description: 'Interval in seconds.' },
            enable: { type: 'boolean', description: 'Enable or disable interval.' }
        },
        outs: { tick: { type: 'number', description: 'DateTime.now() at the specified interval.' } }
    })
    __timer: NodeJS.Timeout


    constructor() {
        super()
        this.ins = { interval: 10042 }
        this.outs = { tick: 0 }
        this.tags = { _typeInfo: Ticker._typeInfo }

        // this.ins.on("interval", (v) => {
        //     this.setTimer()
        // })
        this.ins.onAny(() => {
            this.setTimer()
        })

        this.setTimer()
    }
    setTimer() {
        if (this.__timer) clearInterval(this.__timer)
        let self = this
        this.__timer = setInterval(() => {
            self.outs.tick++
        }, this.ins.interval)
    }
}

// ----------------------------------------------------------------------------
export class AriSyncApp extends SyncObject {
    root: any
    //hueGW: AriSyncNode
    constructor() {
        super()

        console.log("********************************************************************************")
        // this.children.HueGW = {
        //     tags: {
        //         description: "..."
        //     },
        //     children: {
        //         Lamps: {
        //             children: {
        //                 Lamp1: {
        //                     ins: {
        //                         brightness: {
        //                             description: "Brightness!",
        //                             v: 0
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }
        this.Ticker = new Ticker()
        // console.log("Ticker:", this.children.Ticker)
        // console.log("Ticker._typeInfo:", Ticker._typeInfo)
        this.Ticker2 = new Ticker()
        // this.Ticker2.ins.interval = 777
        // console.log("Ticker2:", this.children.Ticker2)


        // this.children.Ticker.children = {}
        // var t0 = performance.now();
        // let i = 10000
        // while (--i) {
        //     this.children.Ticker.children[i] = new Ticker(this)
        // }
        // var t1 = performance.now();
        // console.log("Adding Tickers took " + (t1 - t0) + " milliseconds.")
        // console.log("SyncElements:", Object.keys(this.__syncObjects).length)


        // this.children.HueGW.tags.description = "New..."
        // let m = this.children.HueGW.children.Lamps.children.Lamp1.ins.brightness
        // setInterval(() => {
        //     m.v++
        // }, 1000)

        // this.children.GW433 = {}


        // console.log("SyncApp", this)
        // console.log("SyncApp", JSON.stringify(this, null, 2))
        // console.log("SyncApp", JSON.stringify(this, (k, v) => { return k.startsWith("__") ? undefined : v }, 2))

        console.log("ELEMENTS")
        let i = 0
        for (let e in SyncProvider.syncElements) {
            console.log(e, JSON.stringify(SyncProvider.syncElements[e].__$getSyncState().v, (k, v) => { return k.startsWith("__") ? undefined : v }))
            // console.log(e, JSON.stringify(SyncProvider.instance.__syncObjects[e], (k, v) => { return k.startsWith("__") ? undefined : v }))
        }


    }
}
