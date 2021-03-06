
// NOTE FOR SELF: Source is in __FRONT___

/**
 * @description Generic protocol handler between ARI peers.
 * @function on(name, callback) = Register function <callback> to be called on command/telegram named <name> from peer.
 * @function call(name, args) = Call remote function <name> with arguments <args>
 * @function notify(name, args) = Send <name> message/telegram to peer with arguments <args>
 */
export class AriProtocolHandler {
    private _requestHandlers: { [functionName: string]: (args: any) => any } = {}
    private _pendingRequests: { [id: number]: { resolve: (returnValue: any) => void, reject: (rejectValue: any) => void } } = {}
    private _reqId = 0
    public out_send = (message: string) => { }   // Override to send message to peer.
    constructor() {
    }
    async receive(message: string) {
        let self = this
        var json: any = undefined
        try {
            json = JSON.parse(message)
        }
        catch (err) {
            console.log("Error in received websocket data.")
            console.log("Data:", message)
            console.log("Error:", err)
        }
        console.log("wsRx:", message)
        if ("op" in json) {
            if (json.op in this._requestHandlers) {
                if ("req" in json) {
                    // Handle request
                    var retVal = this._requestHandlers[json.op](json.args)
                    if (retVal instanceof Promise) {
                        try {
                            let ok = await retVal
                            return JSON.stringify({ res: json.req, ok: ok })
                        } catch (err) {
                            // Don't return exeptions - throw, to ensure we detect and fix!!!
                                console.log("Promise error:", err)
                                return JSON.stringify({ res: json.req, err: "Exception on server: " + err })
                                //process.exit(1)
                                // TODO: Restart
                                // throw(err)
                                // ws.send(JSON.stringify({ res: msg.req, err: err }))
                        }
                    } else {
                        // Treat function as synchronus call and return return value!
                        return JSON.stringify({ res: json.req, ok: retVal })
                    }
                } else {
                    // Handle event/notification - Ignore any return values!
                    this._requestHandlers[json.op](json.args)
                    return null
                }
            } else {
                console.log("Error: Missing handler for protocol call:", json.op)
            }
        } else {
            if("res" in json) {
                // Handle response
                let {resolve, reject} = this._pendingRequests[json.res]
                delete this._pendingRequests[json.res]
                if("ok" in json) resolve(json.ok)
                else if("err" in json) reject(json.err)
            }
        }
    }
    call(name: string, args: any = {}) {
        return new Promise<any>((resolve, reject) => {
            // TODO: Implement timeout rejection
            this._pendingRequests[this._reqId] = { resolve, reject }
            this.out_send(JSON.stringify({ op: name, req: this._reqId, args: args }, this.__jsonReplacer))
            this._reqId++
        })
    }
    emit(name: string, args: any) {
        this.out_send(JSON.stringify({ op: name, args: args }, this.__jsonReplacer))
    }
    on(name: string, callback: (args: any) => any) {
        this._requestHandlers[name] = callback
    }
    wrap(targetObject: any){
        // EXPERIMENTAL!
        for(let prop in targetObject) {
            if(!(prop.startsWith("__"))) {
                if(typeof(targetObject[prop] == "function")) {
                    this.on(prop, targetObject[prop])
                }
            }
        }
    }
    //------------------
    // Support functions
    private __jsonReplacer(key: string, value: any) {
        if (key.startsWith("__")) return undefined
        else return value
    }
}