import { appRoot } from "./AppRoot"

var log = appRoot.logger.createNamedLogger("main")
log.user("ARI 3 starting.")
log.user("---------------")

// require("./TreeHugger.js")

import { WsServer } from "./WsServer"
appRoot.wsServer = new WsServer()

//----------------------------------
// import { Observable, Subject, ReplaySubject, from, of, range } from 'rxjs';
// import { map, filter, switchMap } from 'rxjs/operators';
// import { Graph } from "./AriGraphEngine/GraphEngine"

// Graph.loadTypes(`${__dirname}/AriGraphEngine/AriNodes/**/*.js`)

// var graph = new Graph();
// let t = graph.addNode("Ticker", { ins: { interval: 1000 } })
// let c = graph.addNode("Console", { ins: { log: "Starting app..." } })
// graph.connect({ source: "Ticker.outs.ticks", destination: "Console.ins.log" })

// t.outs.ticks.observable.forEach(x => {
//   console.log("ticks:", x)
// })
// t.outs.test.observable.forEach(x => {
//   console.log("x:", x)
// })



