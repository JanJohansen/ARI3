import { AriGraphNode, AriNodeBase } from "../GraphEngine"

export class Ticker extends AriGraphNode {
    //---------------
    // static information about the node
    // static AriNodeInfo = {
    //     typeName: "Ticker",
    //     author: "Jan Johansen",
    //     infoUrl: "",
    //     description: "Sends out counter values at a configurable interval."
    // }

    //---------------
    // Members
    __timeout: NodeJS.Timeout
    count: number = 0

    public constructor(parent: AriNodeBase, name: string, config: any = {}) {
        super(parent, "Ticker", name, config);
        console.log("Creating Ticker...")

        // Define IO's
        this.addInput("interval", "intervalType", (value, input) => {
            if (this.__timeout) clearInterval(this.__timeout)
            this.__timeout = setInterval(() => {
                this.outs!.ticks._set(this.count++)
            }, value)
        })
        this.addOutput("ticks", "number", 0)

        // Apply config (set current state, ets.)
        this.applyConfig(config)
    }
}
