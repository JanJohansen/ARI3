export class AriModel {
    private vTree: any
    private subTree: any
    local: any
    name: string
    constructor(name: string) {
        this.vTree = { __parent: null, name: "Ari" }
        this.subTree = { __parent: null}
    }
    //*************************************************************************
    // Public API
    define(path: string, definition: any) {
        let [objPath, propPath] = this.splitPath(path)
        let target = this.getOrCreateChildPath(objPath)
        this.patch(definition, target)
    }
    delete(path: string) {
        let [objPath, propPath] = this.splitPath(path)
        let name = objPath.pop() || ""
        let parent = this.getChildPath(objPath)
        this.deleteChild(name, parent)
    }
    onCall(path: string, cb: (v: any) => Promise<any>) {
        let [objPath, propPath] = this.splitPath(path)
        let target = this.getOrCreateChildPath(objPath)
        target.calls = target.calls || {}
        target.calls[propPath[0]] = target.calls[propPath[0]] || {}
        target.calls[propPath[0]].__cb = cb
    }
    onIn(path: string, cb: (v: any) => void) {
        let [objPath, propPath] = this.splitPath(path)
        let target = this.getOrCreateChildPath(objPath)
        target.ins = target.ins || {}
        target.ins[propPath[0]] = target.ins[propPath[0]] || {}
        if (!target.ins[propPath[0]].__cbs) target.ins[propPath[0]].__cbs = []
        target.ins[propPath[0]].__cbs.push(cb)
    }
    setOut(path: string, value: any) {
        let [objPath, propPath] = this.splitPath(path)
        let target = this.getOrCreateChildPath(objPath)
        target.outs = target.outs || {}
        target.outs[propPath[0]] = target.outs[propPath[0]] || {}
        target.outs[propPath[0]].v = value

        // TODO: Notify subscribers
        
    }

    // External API
    async getInfo(path: string, cb: (tree: any) => void) {
        let [objPath, propPath] = this.splitPath(path)
        let parent = this.getChildPath(objPath)
        return parent
    }
    async call(path: string, args: any) { 
        let [objPath, propPath] = this.splitPath(path)
        let parent = this.getChildPath(objPath)
        if(parent.calls && parent.calls[propPath[0]]) {
            if(parent.calls[propPath[0]].__cb) {
                let result = await parent.calls[propPath[0]].__cb(args)
                return result
            }
            throw("No call handler on object for call named: " + propPath[0])
        }
        else throw("No call on object named: " + propPath[0])
    }
    onOut(path: string, cb: (v: any) => void) {
        let [objPath, propPath] = this.splitPath(path)
        let target = this.getOrCreateChildPath(objPath)
        target.outs = target.outs || {}
        target.outs[propPath[0]] = target.outs[propPath[0]] || {}
        if (!target.outs[propPath[0]].__cbs) target.outs[propPath[0]].__cbs = []
        target.ins[propPath[0]].__cbs.push(cb)
    }
    setIn(path: string, value: any) { 
        let [objPath, propPath] = this.splitPath(path)
        let target = this.getOrCreateChildPath(objPath)
        target.ins = target.ins || {}
        target.ins[propPath[0]] = target.ins[propPath[0]] || {}
        target.ins[propPath[0]].v = value

        // TODO: Notify subscribers

    }
    sub(path: string, cb: (v: any) => void, options: any = undefined) { 
        // TODO: How?
        // pathTree => changeTree => subscriptionTree => notificatioTree
        let [objPath, propPath] = this.splitPath(path)
        let subNode = this.subTree
		while(path.length){
            let part = objPath.shift()
            if(!(part! in subNode)) subNode[part!] = {}
            subNode = subNode[part!]
		}
        
    }

    //*************************************************************************
    // Helpers:
    private splitPath(path: string) {
        let [objPath, propPath] = path.split(":")
        let paths = [objPath ? objPath.split(".") : [], propPath ? propPath.split(".") : []]
        return paths
    }
    getOrCreateChildPath(path: string | string[], node: any = this.vTree): any {
        if (typeof (path) == "string") path = path.split(".")
        let pathIdx = 0
        let child = node
        while (pathIdx < path.length) {
            if (!(child.children) || !(child.children[path[pathIdx]])) child = this.addChild(path[pathIdx], child)
            else child = child.children[path[pathIdx]]
            pathIdx++
        }
        return child
    }
    getChildPath(path: string | string[], node: any = this.vTree): any {
        if (typeof (path) == "string") path = path.split(".")
        let pathIdx = 0
        let child = node
        while (pathIdx < path.length) {
            if (!(child.children) || !(child.children[path[pathIdx]])) return undefined
            else child = child.children[path[pathIdx]]
            pathIdx++
        }
        return child
    }
    addChild(name: string, target: any): any {
        target.children = target.children || {}
        target.children[name] = { __parent: target, name: name }
        return target.children[name]
    }
    deleteChild(name: string, target: any): boolean {
        if (!(name in target.children)) return false
        target.children[name].__parent = null // allow GC!
        delete target.children[name]
        if (Object.keys(target.children).length == 0) delete target.children
        return true
    }
    patchObject(definition: any, target: any) {
        if (definition == null) {
            // delete node
            delete target.__parent.children[target.name]
            target.__parent = null  // Allow GC
        } else {
            for (let prop in definition) {
                if (prop == "name") continue
                if (prop == "children") {

                }
                if (prop.startsWith("__")) continue
                if (definition[prop] == null) {
                    delete target[prop]
                } else target[prop] = definition[prop]
            }
        }
    }
    patch(patch: any, target: any) {
        if (typeof (patch) == "object") {
            if (typeof (target) != "object") target = {}
            for (let prop in patch) {
                if ((patch[prop] == null) && (prop in target)) delete target[prop]
                else {
                    target[prop] = this.patch(patch[prop], target[prop])
                }
            }
            return target
        }
        else {
            return patch
        }
    }
}

// Idea: Support for "rate limited/batch updates"
// let subOpts = {
//     mask: "?xyz*",
//     range: [min, max],
//     tsRange: [startTime, endTime],
//     revRange: [startRev, endRev],
//     minInterval: 1000, // msec
//     stream: true, // All values needed (put in array)
//     event: true, // Only deliver changes (not current value on subscription)
//     value: true // default true = deliver initial value on subscription
// }

/*
Match patterns:
    _ matches the name assigned to "self" (requested name might have been "uniquelyfied")
    * match single level of any name
    ** match multiple levels of any name (Probably equals "*.*.*")
    + will match both patpern before
*/

/*
Ari: {
TestClient.ts:44
  "__parent": "<hidden>",
  "name": "TestClient",
  "description": "433MHz Gateway",
  "ins": {
    "in1": {
      "description": "Input 1"
    }
  },
  "outs": {
    "__ssSubs": ["v":[7]] // Indicating that subscription 7 subscribes to **.v from here!
    "out1": {
      "__Subs": [10] // Indicate that sub 10 subs directly to this value.
      "v": 4242,
      "description": "Output 1"
    }
  },
  "calls": {
    "call1": {
      "description": "Testcall. Returns provided args."
    }
  },
  "children": {
    "switch1": {
      "__parent": "<hidden>",
      "name": "switch1",
      "description": "433MHz switch",
      "ins": {
        "state": {
          "description": "state",
          "__cbs": "<hidden>"
        }
      },
      "calls": {
        "testCall": {
          "description": "Testcall. Returns provided args.",
          "__cbs": "<hidden>"
        }
      }
    }
  }
}

*/