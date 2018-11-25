import { Graph, AriNodeBase } from "../GraphEngine"
import { BehaviorSubject } from "rxjs"
import { filter } from "rxjs/operators"

export class Ticker extends AriNodeBase {
    //---------------
    // static information about the node
    static AriNodeInfo = {
        typeName: "Ticker",
        author: "Jan Johansen",
        infoUrl: "",
        description: "Sends out counter values at a configurable interval."
    }

    //---------------
    // Members
    timeout: NodeJS.Timeout

    public constructor(parent: Graph, config: any = {}) {
        super(parent);

        // Define IO's
        this.addInput("interval", 1000, {description: "Specifies the interval at which count is sent to 'outs.ticks'"})
        this.addOutput("ticks", 0, {description: "Sends out an increasing counter value with 'ins.interval' millisecons between increments."})
        this.addOutput("test", 0, {description: "Test output for development...'"})

        // Do stuffs
        let count = 1
        this.ins!.interval.observable.forEach(interval => {
            if (this.timeout) clearInterval(this.timeout)
            this.timeout = setInterval(() => {
                this.outs!.ticks.observable.next(count++)
            }, interval)
        }).catch(err=>{console.log("ERROR:", err)})
        this.outs!.ticks.observable.pipe(filter(x => x % 10 == 0)).forEach(x => this.outs!.test.observable.next(x))

        // Apply config (set current state, ets.)
        this.applyConfig(config)
    }
}
