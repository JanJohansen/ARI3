import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Graph } from "../AriGraphEngine/GraphNode"
import { isObject } from 'util';


// Program structure
/**
Root
    Servers
        TCPServer
            Connection
            Connection(1)
            Connection(2)
    Clients (from any connections)
        433GW (from Connection)
            Devices
                DoorBell
                GarageOpener
        HueGW (from Connection(1))
            Lamps
                LivingroomFlooLamp
                    Brightness

 */

/*
Features for an AriNode
    Get state (serialize state)
        Get output values
        Get output notifications
    Set state (deserialize)
        Set inputs
    Traverse object tree for visualization
        Parent relatyion to be knows
*/

// interface for saving, restoring state.
// Use same interface for getting updtes to part config/state and for sending change notifications?
interface INodeConfig {
    ins?: { [name: string]: any },
    outs?: { [name: string]: any }
}
export interface IAriNodeIO {
    name: string
    type: string
    description?: string
    observable: BehaviorSubject<any>
}

interface IAriCallable {
    [name: string]: (args: { [parameterName: string]: any }) => { [returnValueName: string]: any }
}

interface IAriNodeBase {
    name: string                                // Name of this node - used for identification and traversal
    parent: IAriNodeBase | null                 // Reference to parent (or null if root node)
    description?: string                        // Description of the node
    children?: { [name: string]: IAriNodeBase } // Child-nodes in exposed node tree
    ins?: { [name: string]: IAriNodeIO }        // Inputs exposed to public
    outs?: { [name: string]: IAriNodeIO }       // Outputs exposed to public
    calls?: { [name: string]: IAriCallable }    // Function calls exposed to public
    internal?: { [name: string]: any }          // Used for internal stuff.. Included when getting/setting state
    bubble(event: IAriBubbleEvent): IAriBubbleResponse | void
    sink(event: IAriSinkEvent): IAriSinkResponse | void
}

interface IAriEvent {
    name: string
}
interface IAriSinkEvent extends IAriEvent {
    dest: [string]
    reqId?: number
}
interface IAriSinkResponse extends IAriEvent {
    resId: number
}
interface IAriBubbleEvent extends IAriEvent {
    source: [string] | IAriNodeBase
    reqId?: number
}
interface IAriBubbleResponse extends IAriEvent {
    resId: number
}

export class AriNodeBase implements IAriNodeBase {
    static AriNodeInfo: {
        typeName: string
        description: string
    }

    // IAriNodeBase reservations
    name: string
    parent: IAriNodeBase | null
    description?: string                        // Description of the node
    children?: { [name: string]: IAriNodeBase } // Child-nodes in exposed node tree
    ins?: { [name: string]: IAriNodeIO }        // Inputs exposed to public
    outs?: { [name: string]: IAriNodeIO }       // Outputs exposed to public
    calls?: { [name: string]: IAriCallable }    // Function calls exposed to public
    internal?: { [name: string]: any }          // Used for internal stuff.. Included when getting/setting state

    constructor(parent: IAriNodeBase | null, config: INodeConfig = {}) {
        this.parent = parent
    }

    addInput(name: string, defaultValue: any, info: { description?: string } = {}, callBack?: (valu: any) => void): BehaviorSubject<any> {
        let ioInfo: IAriNodeIO = {
            name: name,
            type: typeof (defaultValue),
            observable: new BehaviorSubject<any>(defaultValue),
            description: info.description
        }
        if (!this.ins) this.ins = {}
        this.ins[name] = ioInfo
        if (callBack) ioInfo.observable.forEach(callBack)
        return ioInfo.observable
    }

    addOutput(name: string, defaultValue: any, info: { description?: string } = {}) {
        let ioInfo: IAriNodeIO = {
            name: name,
            type: typeof (defaultValue),
            observable: new BehaviorSubject<any>(defaultValue),
            description: info.description
        }
        if (!this.outs) this.outs = {}
        this.outs[name] = ioInfo
        return ioInfo.observable
    }

    applyConfig(config: INodeConfig) {
        for (let name in config.ins!) {
            if (name in this.ins) this.ins[name].observable.next(config.ins![name])
        }
        for (let name in config.outs!) {
            if (name in this.outs) this.outs[name].observable.next(config.outs![name])
        }
    }

    /**
     * @description Get current configuration/state of object tree.
     */
    getConfig(args: { recursive: boolean, config: any }) {
        var config = args.config || {}
        config.name = this.name
        

        config.ins = this.ins;
        config.ins = this.ins;
        if (args.recursive) {
            for (let child in this.children!) {

            }
        }
    }

    sinkHandlingIdeas() {
        this.onSinkEvent("getInfo", (args) => {
            // if (args.dest[0] == "*") 1 = 1
        })
    }


    // *** NEXT STEPS:
    // Build app from WWW side, re request structure on server (as below)
    // Get response and build up visual representation (Maybe just the JSON)
    // Build up server local API as moving along... First structure, then content, then live content?

    // Make traversing function to traverse sourdce and dest tree's!
    traverseTree(src: any, dest: any, match:(srcKey: any, srcValue: any, destKey: any, destValue: any)=>{}){
        for(let srcKey in src){
            if(match(srcKey, src[srcKey], destKey, dest[destKey])) return 1
        }
    }

    // IDEA: Handling of event-TREES's!???
    // Another idea: wildcards in JSON with events for subscription?
    sub = { devices: { "**": { "*": "*" } } }   // Subscribe to all child objects of "devices" where any member has any value
    sub2 = { devices: { "433GW": { "*": "*" } } }   // Subscribe to all direct members of "devices.433GW"
    event3 = { cmd: "sub", path: { devices: { "*": { "*": "*" } } } }   // Subscribe to all direct children 
    reqEvent4 = { re1: 1, cmd: "get", path: { devices: { "**": { "*": "*" } } } }   // Subscribe to all properties for all direct or indirect children of "devices"
    resEvent4 = { res: 1, path: { devices: { "**": { "*": "*" } } } }   // Subscribe to all properties for all direct or indirect children of "devices"


    //----------------------------------------
    // Handle events from parent to children++
    sinkHandlers: { [eventName: string]: ((event: IAriSinkEvent) => any)[] } = {}
    onSinkEvent(eventName: string, cb: (event: IAriSinkEvent) => IAriSinkResponse) {
        if (!(eventName in this.sinkHandlers)) this.sinkHandlers[eventName] = []
        this.sinkHandlers[eventName].push(cb)
    }
    offSinkEvent(eventName: string, cb: (event: IAriSinkEvent) => IAriSinkResponse) {
        this.sinkHandlers[eventName].filter(item => item !== cb)
    }
    sink(event: IAriSinkEvent): IAriSinkResponse | void {
        if (event.name in this.sinkHandlers) this.sinkHandlers[event.name].forEach(cb => cb(event))
    }

    //----------------------------------------
    // Handle event from child to parent++
    bubbleHandlers: { [eventName: string]: ((event: IAriBubbleEvent) => any)[] } = {}
    onBubbleEvent(eventName: string, cb: (event: IAriBubbleEvent) => IAriBubbleResponse) {
        if (!(eventName in this.bubbleHandlers)) this.bubbleHandlers[eventName] = []
        this.bubbleHandlers[eventName].push(cb)
    }
    offBubbleEvent(eventName: string, cb: (event: IAriBubbleEvent) => IAriBubbleResponse) {
        this.bubbleHandlers[eventName].filter(item => item !== cb)
    }
    bubble(event: IAriBubbleEvent) {
        if (event.name in this.bubbleHandlers) this.bubbleHandlers[event.name].forEach(cb => cb(event))
        if (this.parent) this.parent.bubble(event)
    }
}
