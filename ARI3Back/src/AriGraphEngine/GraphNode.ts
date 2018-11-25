const glob = require("glob")
const path = require("path")
import { AriNodeBase, IAriNodeIO } from "./GraphEngine"
import { count } from "rxjs/operators";
import { createConnection } from "net";

export class Graph extends AriNodeBase {
    static AriNodeInfo: {
        typeName: "GraphNode"
        description: "Node representing a root-graph or a sub-grap within another graph."
    }

    static types: { [typeName: string]: new (parent: Graph, config: any) => AriNodeBase } = { AriGraph: Graph }
    nodes: { [name: string]: AriNodeBase } = {}

    constructor() {
        super(null)
    }

    static loadTypes(folderGlob: string) {
        console.log(`Adding AriNode types from ${folderGlob}`)
        glob.sync(folderGlob).forEach(function (file: string) {
            console.log(`Loading: ${file}`)
            let module = require(path.resolve(file));
            for (let x in module) {
                if (module[x].AriNodeInfo) {
                    console.log(`Adding: ${x}`)
                    Graph.registerType(module[x].AriNodeInfo.typeName, module[x])
                } else {
                    console.log(`Skipping: ${x} - AriNodeType name not found in class.`)
                }
            }
        });
    }

    static registerType(typeName: string, factory: new (parent: Graph, config: any) => AriNodeBase) {
        if (typeName in this.types) throw (`Error: Duplicate typeNames being registered! - (${typeName})`)
        Graph.types[typeName] = factory
    }

    addNode(typeName: string, config: any = {}): AriNodeBase {
        if (!(Graph.types[typeName])) throw (`Error: Trying to add unknown AriNode type - ${typeName}`)
        let node = new Graph.types[typeName](this, config)
        node.name = this.createUniqueName(config.name || typeName)
        this.nodes[node.name] = node
        return node
    }
    createUniqueName(name: string) {
        if (!(name in this.nodes)) return name
        let count = 0
        let newName = name
        while (newName in this.nodes) {
            newName = name + count
        }
        return newName
    }

    // Support finding child-graph-nodes
    findNode(path: string[]): AriNodeBase | null {
        let name = path.shift()
        let node: Graph = this
        while (path.length) {
            if (node instanceof Graph) {
                if (name! in node.nodes) {
                    node = this.nodes[name!] as Graph
                    name = path.shift()
                }
            }
        }
        if (path.length == 0) return node
        else return null
    }

    // Support remote call
    connect(args: { source: string, destination: string }) {
        let srcPath = args.source.split(".")
        let srcIO = srcPath.pop()
        let srcNode = this.findNode(srcPath)
        if (!srcNode) return { Err: `Source node (${args.source}) not found.` }

        let destPath = args.destination.split(".")
        let destIO = destPath.pop()
        let destNode = this.findNode(destPath)
        if (!destNode) return { Err: `Destination node (${args.destination}) not found.` }

        var input: IAriNodeIO | null = null
        var output: IAriNodeIO | null = null
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
            //this.connections.push();
            output.observable.forEach((x)=>{
                input!.observable.next(x)
            })

        } else return null;

    }
}