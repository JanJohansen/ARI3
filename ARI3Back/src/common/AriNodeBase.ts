
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
    Get output as latest values
    Get output notifications with callbacks
    Get output notifications as observable
    Set state (deserialize)
        Set inputs as 
            events (no state)
            values (keep last state) or 
            streams (keep all states)
    Traverse object tree for visualization
        Parent relation to be known
*/

//*****************************************************************************
// Interfaces

// interface for saving, restoring state.
// Use same interface for getting updtes to part config/state and for sending change notifications?
interface INodeConfig {
    ins?: { [name: string]: any },
    outs?: { [name: string]: any }
}

export interface IAriNodeInput {
    __parent: IAriNodeBase
    name: string
    type: string
    set(value: any): void
    _get(value: any): void
}
export interface IAriNodeOutput {
    __parent: IAriNodeBase
    name: string
    type: string
    v?: any
    subscribe(callback: (value: any, output: IAriNodeOutput) => void): void
    unsubscribe(callback: (value: any, output: IAriNodeOutput) => void): void
    _emit(value: any): void
    _set(value: any): void
    _next(value: any): void
}
export interface IAriNodeCall {
    __parent: IAriNodeBase
    name: string
    type: string
    call(args: { [parameterName: string]: any }): { [returnValueName: string]: any } | void
}

export interface IAriNodeBase {
    __parent: IAriNodeBase | null                 // Reference to parent (or null if root node)
    name: string                                // Name of this node - used for identification and traversal
    type: string                                // TypeName of this node - used to find metainformation
    children?: { [name: string]: IAriNodeBase } // Child-nodes in exposed node tree
    ins?: { [name: string]: IAriNodeInput }     // Inputs exposed to public
    outs?: { [name: string]: IAriNodeOutput }   // Outputs exposed to public
    calls?: { [name: string]: IAriNodeCall }    // Function calls exposed to public
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

//*****************************************************************************
// Classes

export class AriNodeInput implements IAriNodeInput {
    __parent: IAriNodeBase
    name: string
    type: string
    _onSet: (value: any, input: IAriNodeInput) => void
    constructor(parent: IAriNodeBase, name: string, type: string, callBack: (value: any, input: IAriNodeInput) => void) {
        this.__parent = parent
        this.name = name
        this.type = type
        this._onSet = callBack
    }
    set(value: any): void {
        if (this._onSet) this._onSet(value, this)
    }
    _get(value: any): void {
        if (this._onSet) this._onSet(value, this)
    }
}

export class AriNodeCall implements IAriNodeCall {
    __parent: IAriNodeBase
    name: string
    type: string
    _onCall: (args: { [parameterName: string]: any }) => { [returnValueName: string]: any } | void
    constructor(parent: IAriNodeBase, name: string, type: string, callFunction: (args: { [parameterName: string]: any }) => { [returnValueName: string]: any } | void) {
        this.__parent = parent
        this.name = name
        this.type = type
        this._onCall = callFunction
    }
    call(args: { [parameterName: string]: any }): { [returnValueName: string]: any } | void {
        if (this._onCall) return this._onCall(args)
    }
}

/** @todo move subscription to subscription tree */
export class AriNodeOutput implements IAriNodeOutput {
    __parent: IAriNodeBase
    name: string
    type: string
    v?: any
    _callbacks: ((value: any, output: IAriNodeOutput) => void)[]
    constructor(parent: IAriNodeBase, name: string, type: string, defaultValue: any = undefined) {
        this.__parent = parent
        this.name = name
        this.type = type
        if (defaultValue) this.v = defaultValue
    }
    /** Subscribe to output */
    subscribe(callback: (value: any, output: IAriNodeOutput) => void): void {
        if(!this._callbacks) this._callbacks = []
        // Prevent adding same callback multiple times!
        for (let cb in this._callbacks) {
            if (this._callbacks[cb] == callback) return
        }
        this._callbacks.push(callback)
    }
    unsubscribe(callback: (value: any, output: IAriNodeOutput) => void): void {
        let idx = this._callbacks.indexOf(callback)
        if (idx >= 0) this._callbacks.splice(idx, 1)
    }
    /** internal interface! */
    _emit(value: any): void {
        for (let cb in this._callbacks) {
            this._callbacks[cb](value, this)
        }
    }
    /** internal interface! */
    _set(value: any): void {
        for (let cb in this._callbacks) {
            this._callbacks[cb](value, this)
        }
    }
    /** internal interface! */
    _next(value: any): void {
        for (let cb in this._callbacks) {
            this._callbacks[cb](value, this)
        }
    }
}

export class AriNodeBase implements IAriNodeBase {
    static AriNodeInfo?: {
        description?: string
    }

    // IAriNodeBase reservations
    __parent: IAriNodeBase | null
    name: string
    type: string
    children?: { [name: string]: IAriNodeBase } // Child-nodes in exposed node tree
    ins?: { [name: string]: IAriNodeInput }     // Inputs exposed to public
    outs?: { [name: string]: IAriNodeOutput }   // Outputs exposed to public
    calls?: { [name: string]: IAriNodeCall }    // Function calls exposed to public
    internal?: { [name: string]: any }          // Used for internal stuff.. Included when getting/setting state

    constructor(parent: IAriNodeBase | null, type: string, name: string, config: INodeConfig = {}) {
        this.__parent = parent
        this.type = type
        this.name = name
    }

    addInput(name: string, type: string, callback: (value: any, input: IAriNodeInput) => void): IAriNodeInput {
        let input = new AriNodeInput(this, name, type, callback)
        if (!this.ins) this.ins = {}
        this.ins[name] = input
        // TODO: Handle addition in subscription tree
        return input
    }

    addOutput(name: string, type: string, defaultValue: any = undefined): IAriNodeOutput {
        let output = new AriNodeOutput(this, name, type, defaultValue)
        if (!this.outs) this.outs = {}
        this.outs[name] = output
        // TODO: Handle addition in subscription tree
        // TODO: Handle default value in subscription tree
        return output
    }

    addCall(name: string, type: string, callFunction: IAriNodeCall): void {
        if (!this.calls) this.calls = {}
        this.calls[name] = callFunction
        // TODO: Handle addition in subscription tree
        // TODO: Handle default value in subscription tree
    }

    /** Find child node */
    findNode(path: string | string[]): IAriNodeBase | null {
        if(typeof(path) == "string") path = path.split(".")
        let name = path.shift()
        let node: IAriNodeBase = this
        while (path.length) {
            if (node instanceof AriNodeBase) {
                if(node.children) {
                    if (name! in node.children) {
                        node = this.children![name!]
                        name = path.shift()
                    }
                }
            }
        }
        if (path.length == 0) return node
        else return null
    }

    applyConfig(config: INodeConfig) {
        if(config.ins && this.ins) {
            for (let name in config.ins) {
                if (name in this.ins) this.ins[name].set(config.ins[name])
            }
        }
        if(config.outs && this.outs) {
            for (let name in config.outs!) {
                if (name in this.outs) this.outs[name]._next(config.outs[name])
            }
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

    //----------------------------------------
    // Handle events from parent to children++
    __sinkHandlers: { [eventName: string]: ((event: IAriSinkEvent) => any)[] } = {}
    onSinkEvent(eventName: string, cb: (event: IAriSinkEvent) => IAriSinkResponse) {
        if (!(eventName in this.__sinkHandlers)) this.__sinkHandlers[eventName] = []
        this.__sinkHandlers[eventName].push(cb)
    }
    offSinkEvent(eventName: string, cb: (event: IAriSinkEvent) => IAriSinkResponse) {
        this.__sinkHandlers[eventName].filter(item => item !== cb)
    }
    sink(event: IAriSinkEvent): IAriSinkResponse | void {
        if (event.name in this.__sinkHandlers) this.__sinkHandlers[event.name].forEach(cb => cb(event))
    }

    //----------------------------------------
    // Handle event from child to parent++
    __bubbleHandlers: { [eventName: string]: ((event: IAriBubbleEvent) => any)[] } = {}
    onBubbleEvent(eventName: string, cb: (event: IAriBubbleEvent) => IAriBubbleResponse) {
        if (!(eventName in this.__bubbleHandlers)) this.__bubbleHandlers[eventName] = []
        this.__bubbleHandlers[eventName].push(cb)
    }
    offBubbleEvent(eventName: string, cb: (event: IAriBubbleEvent) => IAriBubbleResponse) {
        this.__bubbleHandlers[eventName].filter(item => item !== cb)
    }
    bubble(event: IAriBubbleEvent) {
        if (event.name in this.__bubbleHandlers) this.__bubbleHandlers[event.name].forEach(cb => cb(event))
        if (this.__parent) this.__parent.bubble(event)
    }
}
