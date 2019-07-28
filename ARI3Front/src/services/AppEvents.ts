import { EventEmitter2 } from "eventemitter2"

let appEvents = new EventEmitter2({
    // set this to `true` to use wildcards. It defaults to `false`.
    wildcard: true,
    // the delimiter used to segment namespaces, defaults to `.`.
    delimiter: '.',
    // set this to `true` if you want to emit the newListener event. The default value is `true`.
    newListener: false,
    // the maximum amount of listeners that can be assigned to an event, default 10.
    maxListeners: 20,
    // show event name in memory leak message when more than maximum amount of listeners is assigned, default false
    verboseMemoryLeak: true
})
appEvents.on("**", function(v){console.log("Evt:", this.event, "=", v)})
export default appEvents