// Idea: Support for "rate limited/batch updates"
// let subOpts = {
//     mask: "?xyz*",
//     range: [min, max],
//     tsRange: [startTime, endTime],
//     revRange: [startRev, endRev],
//     minInterval: 1000, // msec
//     stream: true, // All values needed (put in array)
//     event: true, // Only deliver changes (not current value on subscription)
//     value: true // default true = deliver initial value on subscription
// }

/*
Match patterns:
    _ matches the name assigned to "self" (requested name might have been "uniquelyfied")
    * match single level of any name
    ** match multiple levels of any name (Probably equals "*.*.*")
    + will match both patpern before
*/

import { AriModel } from "./AriModel"
import { AriProtocolHandler } from "./AriProtocolHandler"

export class AriClient {
    private server: AriProtocolHandler
    private subId = 0
    private subscriptions: {[id: number]: (v: any)=>void} = {}
    ariModel: AriModel
    private name: string
    constructor(name: string) {
        this.ariModel = new AriModel("clientAri")
        this.server = new AriProtocolHandler()
        this.name = name
    }
    //*************************************************************************
    // Public API
    define(path: string, definition: any) {
        if(path.startsWith("_")) {
            path = this.name + path.substring(1)
            this.ariModel.define(path, definition)
        } else throw "Error: Defining remote nodes not allowed!"
    }
    delete(path: string) {
        if(path.startsWith("_")) {
            path = this.name + path.substring(1)
            this.ariModel.delete(path)
        } else throw "Error: Deleting remote nodes not allowed!"
    }
    onCall(path: string, cb: (v: any) => Promise<any>) {
        if(path.startsWith("_")) {
            path = this.name + path.substring(1)
            this.ariModel.onCall(path, cb)
        } else throw "Error: Settign output callbacks on remote nodes not allowed!"
    }
    onIn(path: string, cb: (v: any) => void) {
        if(path.startsWith("_")) {
            path = this.name + path.substring(1)
            this.ariModel.onIn(path, cb)
        } else throw "Error: Settign input callbacks on remote nodes not allowed!"
    }
    setOut(path: string, value: any) {
        if(path.startsWith("_")) {
            path = this.name + path.substring(1)
            this.ariModel.setOut(path, value)
        } else throw "Error: Settign outputs on remote nodes not allowed!"
    }

    // External API
    async getInfo(path: string, cb: (tree: any) => void) {
        if(path.startsWith("_")) {
            path = this.name + path.substring(1)
            return this.ariModel.getInfo(path, cb)
        } else {
            // Send request to server!            
            return await this.server.call("getInfo", {path})
        }
    }
    async call(path: string, args: any) { 
        if(path.startsWith("_")) {
            path = this.name + path.substring(1)
            return this.ariModel.call(path, args)
        } else {
            // Send request to server!            
            return await this.server.call("call", {path, args})
        }
    }
    onOut(path: string, cb: (v: any) => void) { 
        if(path.startsWith("_")) {
            path = this.name + path.substring(1)
            return this.ariModel.onOut(path, cb)
        } else {
            // Send request to server!
            this.subscriptions[this.subId] = cb
            this.server.notify("onOut", {path, subId: this.subId})
            return this.subId++
        }
    }
    setIn(path: string, value: any) { 
        if(path.startsWith("_")) {
            path = this.name + path.substring(1)
            this.ariModel.setIn(path, value)
        } else this.server.notify("setIn", {path, value})
    }
    sub(path: string, cb: (v: any) => void, options: any = undefined) { 
        if(path.startsWith("_")) {
            path = this.name + path.substring(1)
            this.ariModel.sub(path, cb)
        } else {
            // Send request to server!
            this.subscriptions[this.subId] = cb
            this.server.notify("sub", {path, subId: this.subId})
            return this.subId++
        }
    }

    //*************************************************************************
    // Helpers:
}
