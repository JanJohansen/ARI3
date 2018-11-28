import { appRoot } from "./AppRoot"

var log = appRoot.logger.createNamedLogger("main")
log.user("ARI 3 starting.")
log.user("---------------")

// require("./TreeHugger.js")

import { WsServer } from "./WsServer"
appRoot.wsServer = new WsServer()

//----------------------------------
import { AriGraph } from "./AriGraphEngine/GraphEngine"

AriGraph.loadTypes(`${__dirname}/AriGraphEngine/AriNodes/**/*.js`)

var graph = new AriGraph(null, "root")
let t = graph.addNode("Ticker", "ticker", { ins: { interval: 1000 } })
let c = graph.addNode("Console", "console", { ins: { log: "Starting app..." } })
graph.connect({ output: "ticker.outs.ticks", input: "console.ins.log" })

graph.addNode("Ticker", "ticker2", { ins: { interval: 443 } })
graph.addNode("Console", "console2", { ins: { log: "Starting app..." } })
graph.connect({ output: "ticker2.outs.ticks", input: "console2.ins.log" })

log.debug("Graph:", JSON.stringify(graph, (key: string, value: any) => { 
    //console.log("Key:", key)
    if(key.startsWith("__")) return undefined
    else return value 
}, 2))