import { Graph, AriNodeBase } from "../GraphEngine"
import { BehaviorSubject } from "rxjs"
import { filter } from "rxjs/operators"

export class Console extends AriNodeBase {
    //---------------
    // static information about the node
    static AriNodeInfo = {
        typeName: "Console",
        author: "Jan Johansen",
        infoUrl: "",
        description: "Control a console. Write log statements, etc."
    }

    //---------------
    // Members
    public constructor(parent: Graph, config: any = {}) {
        super(parent);

        let input = this.addInput("log", "", {description: "Strings sent to this input will be logged (with timestamp) in the console."})

        this.applyConfig(config)

        input.forEach((log)=>{
            console.log(new Date().toISOString() + ":", log)
        })
    }
}
