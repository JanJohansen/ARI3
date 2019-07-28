import { appRoot } from "./AppRoot"
var log = appRoot.logger.createNamedLogger("ariRoot")

import { AriNodeBase } from "./common/AriNodeBase"

export class AriRoot extends AriNodeBase {
    // _pendingCalls: {[Promise<any>: 
    constructor() {
        super(null, "AriRoot", {})
        this.addInput("_wsMsgIn", "{msg: any, ws: WebSocket}", (msg: { msg: any, ws: WebSocket }) => {
            log.developer("MsgRx:", msg.msg)
            if ("op" in msg.msg) {
                if(msg.msg.op == "call") {
                    if (msg.msg.name in this.calls!) {
                        this.calls![msg.msg.name].call(msg.msg.args)
                            .then((result: any)=>{msg.ws.send(JSON.stringify({res: msg.msg.req, ok:result}))})
                            // .catch(err=>)
                    }
                }
            }
        })
        this.addOutput("_wsMsgOut", "{msg: any, ws: WebSocket}")

        this.addCall("ping", async (args) => {
            log.developer("yay", args)
            return "pong"
        })
    }
}