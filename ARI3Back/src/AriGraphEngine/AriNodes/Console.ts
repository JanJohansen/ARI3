import { AriGraph, AriNodeBase, IAriNodeBase } from "../GraphEngine"

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
    public constructor(parent: IAriNodeBase, name: string, config: any | undefined) {
        super(parent, "Console", name, config);

        let input = this.addInput("log", "any", (value, input)=>{
            console.log(new Date().toISOString() + ":", value)
        })

        this.applyConfig(config)
    }
}
