import { appRoot } from "./AppRoot"
var log = appRoot.logger.createNamedLogger("AriClientServer")

import { AriNodeBase } from "./common/AriNodeBase"
import { AriProtocolHandler } from "./common/AriProtocolHandler"
import { AriObject } from "./common/AriNode"

export class AriClientServer {
    ariObject: AriObject
    protocolHandler: AriProtocolHandler
    clientNode: AriNodeBase | undefined
    constructor(ariRoot: AriNodeBase) {
        
        this.ariObject = new AriObject()
        this.ariObject.pub("connected", true)
        this.ariObject.pub("ip", )

        this.protocolHandler = new AriProtocolHandler()
        this.protocolHandler.on("authenticate", async (args: any) => {
            log.debug("Authenticating:", args)
            if (!("token" in args)) return { err: "Authentication failed: Invalid token." }
            if (args.token == 42) return { userName: "Mr.42." }
            else return { err: "Authentication failed." }
        })
        this.protocolHandler.on("reqAuth", async (args: any) => {
            log.debug("Request for authentification token:", args)
            if ("user" in args && "pw" in args) {
                if (args.pw == 42) {
                    // TODO: Find next unique name for user
                    let userName = args.user + "(1)"
                    let clients = ariRoot.getOrCreateChild("_clients")
                    this.clientNode = clients.getChild(userName)
                    if (!this.clientNode) {
                        this.clientNode = new AriNodeBase(null, userName)
                        clients.addChild(this.clientNode)
                    }
                    return { name: userName, token: 42 }
                } else return { err: "Authentication failed." }
            }
        })
        this.protocolHandler.on("ping", async (args: any) => {
            // log.debug("Got ping:", args)
            return args
        })
        // this.protocolHandler.on("update", (args: any) => {
        //     log.developer("INIT!", this.clientNode)
        //     // TODO: Should we disconnect!?
        //     if (!this.clientNode) return

        //     // TODO: Find target node in own family tree
        //     if (!args.name) {
        //         log.user("Error: Client not specifying any name!")
        //         return
        //     }
        //     if (args.name != this.clientNode.name) {
        //         log.user("Error: Client", this.clientNode.name, "not using assigned name! (Using:", args.name, ")")
        //         return
        //     }
        //     let target = ariRoot.findNode(args.name)

        //     if (!target) {
        //         target = new AriNodeBase(null, args.name)
        //         ariRoot.addChild(target)
        //     }
        //     log.debug("Target:", target)
        //     target.update(args)

        //     log.debug("Node updated:", JSON.stringify(ariRoot, this.__jsonReplacer, 2))
        // })
        this.protocolHandler.on("call", async (args: any) => {
            log.debug("Call:", args.path, args.args)
            return ariRoot.call(args.path)
        })

        //---------------------------------------------------------------------
        this.protocolHandler.on("getRoots", (args: any) => {
            console.log("GETROOTS!!!", args)
            return { roots: {} }
        })
        this.protocolHandler.on("subscribe", (args: any) => {
            console.log("SUBSCRIBE!!!", args)
        })
        this.protocolHandler.on("unsubscribe", (args: any) => {
            console.log("UNSUBSCRIBE!!!", args)
        })
    }
    close() {

    }

    //------------------
    // Support functions
    private __jsonReplacer(key: string, value: any) {
        if (key.startsWith("__")) return undefined
        else return value
    }
}