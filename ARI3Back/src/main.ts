import { appRoot } from "./AppRoot"
var log = appRoot.logger.createNamedLogger("main")
log.user("ARI 3 starting.")
log.user("---------------")

//----------------------------------
// Websocket Server
import { WsServer } from "./WsServer"
appRoot.wsServer = new WsServer()


// import { MQTTTrap } from "./MQTTTrap"
// var MQTTT = new MQTTTrap()

import { AriSyncApp } from "./common/AriSyncClient"
let app = new AriSyncApp()


// Doesn't work - broken!!!
// import {AlexaFauxMo} from "./Adapters/AlexaFauxmo/main"
// let alexaFM = new AlexaFauxMo()

/**
 * Get history, current value and future values
 * Support use of "Aliases"
 */

// require("./TreeHugger.js")


// import { AriRoot } from "./AriRoot"
// appRoot.AriRoot = new AriRoot()

// appRoot.wsServer.outs.WsMessage.connect(appRoot.AriRoot.ins._wsMsgIn)


// EE2 tests
// console.log("******************EE2 tests")
// import { EventEmitter2 } from "eventemitter2"
// let evt = new EventEmitter2({ wildcard: true, delimiter: '.', newListener: false, maxListeners: 20, verboseMemoryLeak: true })
// //evt.on("**", function (v) { console.log("MainEvt:", this.event, "=", v) })
// evt.on("1.11.111", function (v){console.log(this.event, "=", v)})
// evt.on("1.1", function (v){console.log(this.event, "=", v)})
// evt.on("1", function (v){console.log(this.event, "=", v)})
// evt.emit("1.*", 1)
// evt.emit("**", 2)
// console.log(JSON.stringify(evt.listeners("**"))) // [ [Function] ]
// console.log(JSON.stringify(evt.listeners("1"))) // [ [Function] ]


//----------------------------------
// AriBrokerTests
// Support functions
// let __jsonReplacer = function(key: string, value: any) {
// 	if (key.startsWith('__')) return undefined
// 	else return value
// }
// let logEvent = function(subId: number, v: any, rTree: any) {
// 	console.log('! Event:', subId, '=', JSON.stringify(v, __jsonReplacer, 2), "=", JSON.stringify(rTree, __jsonReplacer, 2))
// }

// import { AriTree } from "./common/AriTree"
// let ari = new AriTree('GW433')
// ari.log = (...args: any)=>{console.log(...args)}

// console.log('Testing **********************************************************')
// console.log('vTree --->', JSON.stringify(ari.vTree, null, 2))
// ari.set('1.2.3', 42)
// console.log('vTree --->', JSON.stringify(ari.vTree, null, 2))

// console.log('Testing **********************************************************')
// let result = ari.on('1.2.3', logEvent)
// console.log('sTree:', JSON.stringify(ari.sTree, null, 2))
// ari.on('1.2.3', logEvent)
// console.log('sTree:', JSON.stringify(ari.sTree, null, 2))


// console.log('Testing **********************************************************')
// ari.set('1.2.3', 43)
// console.log('vTree --->', JSON.stringify(ari.vTree, null, 2))

// console.log('Testing **********************************************************')
// ari.on('*.*.*', logEvent)
// console.log('sTree --->', JSON.stringify(ari.sTree, null, 2))
// ari.set('1.2.4', 45)
// console.log('vTree --->', JSON.stringify(ari.vTree, null, 2))

// console.log('Testing(**) ******************************************************')
// ari.on('**', logEvent)

// console.log('Testing **********************************************************')
// ari.on('*.*.*', logEvent)
// console.log('sTree --->', JSON.stringify(ari.sTree, null, 2))
// ari.set('1.2.4', 45)
// console.log('vTree --->', JSON.stringify(ari.vTree, null, 2))


// ari.on('GW433.outs.out2.v', logEvent)
// console.log('on 1 --->', JSON.stringify(ari.sTree, null, 2))

// ari.set('_.GW433.$ariModel', { description: '', outs: { connected: { description: '' } } })
// console.log('on 2 --->', JSON.stringify(ari.vTree, null, 2))

// ari.set('_.GW433.outs.connected', { v: false })
// ari.set('_.GW433.outs.connected', { v: false, ts: '20190101_22:22:22.222Z' })
// ari.set('_.GW433.calls.reset', true)
// console.log('on 3 --->', JSON.stringify(ari.vTree, null, 2))

// ari.set('_.GW433.$ariModel', {
// 	description: '433MHz gataway',
// 	outs: {
// 		connected: { description: '' },
// 		ping: { description: '' }
// 	},
// 	children: {}
// })
// ari.set('_.GW433.devices.01zzz00100.$ariNode', {
// 	description: 'Digital signal from device!',
// 	outs: { state: { description: 'State of signal from device.' } }
// })
// console.log('on 4 --->', JSON.stringify(result, null, 2))
// result = ari.on('1.*.3', logEvent)
// console.log('on 5 --->', JSON.stringify(result, null, 2))

// console.log('on 6 --->', JSON.stringify(ari.vTree, null, 2))
// result = ari.on('1.*.3.4', logEvent)
// console.log('on 6 --->', JSON.stringify(result, null, 2))

// console.log('performance test *************************************************')
// let i = 100000
// let start = new Date();
// while(i--){
// 	ari.set(i%100+".2."+i+".5.6.7.8", i)
// 	//process.nextTick(ari.set, i+".2."+i+".5.6.7.8", i)
// }
// let end = new Date();
// console.log(`Benchmark took ${(end - start)} mSec`);


//----------------------------------
// AriNodeTests
// import { AriNodeBase } from "./common/AriNodeBase"
// let root = new AriNodeBase(null, "AriRoot")
// root.addInput("in1", "number", (val, input) => {
//     log.developer("in1 = ", val)
// })
// root.addOutput("out1", "number", 42)
// root.notify = (args) => {
//     log.developer("notify:", JSON.stringify(args, null, 2))
// }

// let child1 = new AriNodeBase(root, "child1")
// child1.addOutput("out1", "number", 43)
// let child2 = new AriNodeBase(root, "child2")
// child2.addOutput("out1", "number", 44)

// //root.once({ path: { outs: { "*": "*" }}, reqId: 1})
// root.once({ path: { "**": { outs: { "*": "*" }}}, reqId: 1})

//----------------------------------
// AriClient tests
// import { TestClient } from "./TestClient"
// import { AriClientServer } from "./AriClientServer";
// import { AriNodeBase } from "./common/AriNodeBase";
// let ariRoot = new AriNodeBase(null, "ari")
// let clientServer = new AriClientServer(ariRoot)
// let testClient = new TestClient()
// testClient.ari.onOut = (msg) => { clientServer.protocolHandler.handleMessage(msg) }



//----------------------------------
// GraphEngine
// import { AriGraph } from "./AriGraphEngine/GraphEngine"
// AriGraph.loadTypes(`${__dirname}/AriGraphEngine/AriNodes/**/*.js`)

// var graph = new AriGraph(null, "root")
// let t = graph.addNode("Ticker", "ticker", { ins: { interval: 1000 } })
// let c = graph.addNode("Console", "console", { ins: { log: "Starting app..." } })
// graph.connect({ output: "ticker.outs.ticks", input: "console.ins.log" })

// graph.addNode("Ticker", "ticker2", { ins: { interval: 443 } })
// graph.addNode("Console", "console2", { ins: { log: "Starting app..." } })
// graph.connect({ output: "ticker2.outs.ticks", input: "console2.ins.log" })

// log.debug("Graph:", JSON.stringify(graph, (key: string, value: any) => { 
//     //console.log("Key:", key)
//     if(key.startsWith("__")) return undefined
//     else return value 
// }, 2))

// let target = {
//     o1: {
//         o11: {
//             outs: {
//                 p1: 42
//             }
//         }
//     }
// }
// let subscribe = {
//     '**': {
//         '**': {
//             outs: {
//                 '*': '*'
//             }
//         }
//     }
// }
// let subscribeAsString = '*.*.outs.*=*'
// let subscribeAsJSON = { '*': { '*': { outs: { '*': '*' } } } }
// let subs = {
//     '**': {
//         __oSubIds: [1, 2],
//         '**': {
//             __oSubIds: [1, 2],
//             outs: {
//                 __oSubIds: [1],
//                 __pSubPatts: {
//                     '*': {
//                         '*': [1]
//                     }
//                 }
//             }
//         }
//     }
// }
// let update = {
//     o1: {
//         o11: {
//             outs: {
//                 p1: 43
//             }
//         }
//     }
// }
// let match = function (pattern: string, target: string) {
//     let match = false
//     if (pattern.startsWith("*")) match = true
//     else if (pattern == target) match = true

//     log.developer("Matching:", pattern, "=", target, " - ", match ? "MATCH!" : "NO MATCH!")
//     return match
// }
// let doUpdate = function (update: any, target: any, subs: any, results: any = {}) {
//     // Idea: Follow update tree and create notification tree based on subscription tree config!
//     for (let uProp in update) {
//         // Check if we are subscribing to updates on this update
//         for (let sProp in subs) {
//             if (!sProp.startsWith("__")) {
//                 if (match(sProp, uProp)) {
//                     if ("__oSubIds" in subs[sProp]) {
//                         // there is 1-x subscriptions for this object
//                         var newResults: any = {}
//                         for (let i = 0; i < subs[sProp].__oSubIds.length; i++) {
//                             let subId = subs[sProp].__oSubIds[i]
//                             results[subId] = results[subId] || {}
//                             results[subId][uProp] = {}
//                             newResults[subId] = results[subId][uProp]
//                         }
//                     }
//                     // Check for propoertySubscriptionPatterns
//                     if ("__pSubPatts" in subs[sProp]) {
//                         // there is 1-x subscriptions for this property member
//                         for (let pattern in subs[sProp].__pSubPatts) {
//                             if (match(pattern, sProp)) { }
//                         }

//                         for (let i = 0; i < subs[sProp].__pSubPatts.length; i++) {
//                             let subId = subs[sProp].__pSubIds[i]
//                             results[subId] = results[subId] || {}
//                             results[subId][uProp] = {}
//                             newResults[subId] = results[subId][uProp]
//                         }

//                     }
//                     subs = subs[sProp]
//                 }
//             }
//         }

//         // Update target with update value/object
//         if (typeof (update[uProp]) == "object") {
//             if (!(uProp in target)) target[uProp] = {}  // Create new object (path)

//             subs = subs || {}
//             doUpdate(update[uProp], target[uProp], subs, newResults)
//         }
//         else target[uProp] = update[uProp]             // Create new property member
//     }
//     return results
// }
// let results: any = {}
// doUpdate(update, target, subs, results)
// log.developer("Results:", JSON.stringify(results))
// log.developer("Target:", JSON.stringify(target))
// let subscriptionNotification = {
//     o1: {
//         childrent: {
//             o11: {
//                 outs: {
//                     p1: {
//                         __pUpdate: {
//                             sub: [1],
//                             val: 43
//                         }
//                     }
//                 }
//             }
//         }
//     }
// }


// // TYPE REGISTRATION
// class Server {
//     registerType(typeName: string, typeInfo: any) {

//     }
//     registerObject(type: string, state: any) {

//     }
// }
// let server = new Server()
// server.registerType("HueGW", {
//     typeName: "HueGW.Lamp"
// })
// server.registerType("HueGW.Lamp", {
//     typeName: "HueGW.Lamp",
//     description: "Hue lamp instance.",
//     ins: {
//         brightness: {
//             type: "number",
//             description: "Brightnes setpoint for lamp."
//         }
//     },
//     outs: {
//         brightness: {
//             type: "number",
//             description: "Current brightnes of lamp."
//         }
//     }
// })
// server.registerObject("HueGW", {
//     parentId: null,
//     oid: 0
// })
// server.registerObject("HueGW.Lamp", {
//     parentId: 0,
//     outs: {
//         brightness: {
//             v: 42
//         }
//     }
// })