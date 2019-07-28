

export class AriSyncObject {
    __subs: { [memberName: string]: { subObj: any, cb: (subObj: any, value: any) => void } } = {}
//    onNotify: ((value: any)=>void) | undefined = undefined

    constructor() {
    }
    __sub(path: string[], subObj: any, cb: (subObj: any) => void) {
        if (path.length > 1) {
            if (!(path[0] in this)) {
                this[path[0]] = new AriSyncObject()
            }
            // Pass request to child
            path.shift()
            this[path[0]].__sub(path, subObj, cb)
        } else {
            if (!this.__subs) this.__subs = {}
            this.__subs[path[0]] = { cb, subObj }
        }
        // Send current tate to subscriber
        this.__notifySubscribers()
    }
    __set(path: string[], value: any) {
        if (path.length > 1) {
            if (!(path[0] in this)) {
                this[path[0]] = new AriSyncObject()
                this.__notifySubscribers()
            }
            // Pass request to child
            path.shift()
            this[path[0]].__set(path, value)
        } else {
            this[path[0]] = value

            // Send to value subscribers (Call callback!)
            this.__subs[path[0]].cb(this.__subs[path[0]].subObj, value)
        }
    }
    __notifySubscribers() {
        let v: { objs: string[], vals: any[] } = { objs: [], vals: [] }
        for (let key in this) {
            let type = typeof (this[key])
            if (type == "object") {
                if(this[key].keys().length) v.objs.push(key) // Only push member objects w. content! TODO: disregard "__*" ?
            }
            else if (type == "number") v.vals.push(key)
            else if (type == "boolean") v.vals.push(key)
            else if (type == "string") v.vals.push(key)
        }
    }
}

let a = new AriSyncObject()
a.__sub(["O1"], { subInfo: "" }, () => { })       // => []
a.__sub(["O1", "v"], { subInfo: "" }, () => { })   // => udefined





