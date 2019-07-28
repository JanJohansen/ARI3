const glob = require("glob")
const path = require("path")
import { AriNodeBase, AriNodeInput, AriNodeOutput } from "../common/AriNodeBase"

export class AriGraphNode extends AriNodeBase {
    static AriNodeInfo: {
        description: "Node representing a root-graph or a sub-grap within another graph."
    }

    static types: { [typeName: string]: new (parent: AriNodeBase, type: string, name: string, config: any) => AriNodeBase } = { "AriGraphNode": AriGraphNode }
    type: string
    children: { [name: string]: AriNodeBase } = {}
    connecions: {input: AriNodeInput, ouput: AriNodeOutput}[]

    constructor(parent: AriNodeBase | null, type: string, name: string, config: any) {
        super(parent, name)
        this.type = type
    }

    static loadTypes(folderGlob: string) {
        console.log(`Adding AriNode types from ${folderGlob}`)
        glob.sync(folderGlob).forEach(function (file: string) {
            //console.log(`Loading: ${file}`)
            let module = require(path.resolve(file));
            for (let x in module) {
                if (module[x].AriNodeInfo) {
                    console.log(`Adding: ${x}`)
                    AriGraphNode.registerType(module[x].AriNodeInfo.typeName, module[x])
                } else {
                    console.log(`Skipping: ${x} - AriNodeType name not found in class.`)
                }
            }
        });
    }

    static registerType(typeName: string, factory: new (parent: AriGraphNode, config: any) => AriNodeBase) {
        if (typeName in this.types) throw (`Error: Duplicate typeNames being registered! - (${typeName})`)
        AriGraphNode.types[typeName] = factory
    }

    addNode(typeName: string, name: string, config: any = {}): AriNodeBase {
        if (!(AriGraphNode.types[typeName])) throw (`Error: Trying to add unknown AriNode type - ${typeName}`)
        name = this.createUniqueName(config.name || name || typeName)
        let node = new AriGraphNode.types[typeName](this, typeName, name, config)
        this.children[node.name] = node
        return node
    }
    createUniqueName(name: string) {
        if (!(name in this.children)) return name
        let count = 0
        let newName = name
        while (newName in this.children) {
            newName = name + count
        }
        return newName
    }

    // Support remote call
    connect(args: { output: string, input: string }) {
        let srcPath = args.output.split(".")
        let srcIO = srcPath.pop()
        let srcNode = this.findNode(srcPath)
        if (!srcNode) return { Err: `Error when trying to add connection in "${this.name}". Output node for ourput "${args.output}" not found.` }

        let destPath = args.input.split(".")
        let destIO = destPath.pop()
        let destNode = this.findNode(destPath)
        if (!destNode) return { Err: `Error when trying to add connection in "${this.name}". Input node for input "${args.input}" not found.` }

        var input: AriNodeInput | null = null
        var output: AriNodeOutput | null = null
        if (srcIO! in srcNode.ins!) {
            input = srcNode.ins![srcIO!]
        } else if (srcIO! in srcNode.outs!) {
            output = srcNode.outs![srcIO!]
        }
        if (destIO! in destNode.ins!) {
            input = destNode.ins![destIO!]
        } else if (destIO! in destNode.outs!) {
            output = destNode.outs![destIO!]
        }
        if (input && output) {
            // TODO: Store connection configuration
            // output.subscribe((value, output)=>{
            //     input!.set(value)
            // })
        } else return null;
    }
}