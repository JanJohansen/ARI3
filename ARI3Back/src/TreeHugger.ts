

/* 
    TODO: API should support "pathToValue" as parameter like:
        JSON notation e.g. an object like sub({Devices:{device1:{property1:value}}}, ...)
        dot-delimeted string  e.g. "Devices.device1.property1"
        API should also be reachable by code (possibly proxy object traversing to target object)
            E.g. root.Devices.device1.property1.sub(()=>{...})

 
// IDEA: Handling of event-TREES's!???
    // Another idea: wildcards in JSON with events for subscription?
    sub = { devices: { "**": { "*": "*" } } }   // Subscribe to all child objects of "devices" where any member has any value
    sub2 = { devices: { "433GW": { "*": "*" } } }   // Subscribe to all direct members of "devices.433GW"
    event3 = { cmd: "sub", path: { devices: { "*": { "*": "*" } } } }   // Subscribe to all direct children 
    reqEvent4 = { re1: 1, cmd: "get", path: { devices: { "**": { "*": "*" } } } }   // Subscribe to all properties for all direct or indirect children of "devices"
    resEvent4 = { res: 1, path: { devices: { "**": { "*": "*" } } } }   // Subscribe to all properties for all direct or indirect children of "devices"



*/



export class TreeHugger {
    root: any
    constructor(target: any) {
        this.root = target || {}
    }
    match(patternTree: any, cb: (obj: object, prop: any) => any, targetTree: any = this.root, matchTree: any = {}) {
        for (let targetProp in patternTree) {
            if (typeof patternTree[targetProp] == "object") {
                //console.log("-> Check", matchProp);
                // Match objects
                if (targetProp == "**") {
                    for (let targetProp in targetTree) {
                        if (typeof targetTree[targetProp] == "object") {
                            cb(targetTree, targetProp)
                            this.getSubTree(
                                patternTree[targetProp],
                                targetTree[targetProp],
                                matchTree[targetProp]
                            );
                        }
                    }
                } else {
                    if (targetProp in targetTree) {
                        if (typeof targetTree[targetProp] == "object") {
                            cb(targetTree, targetProp)
                            this.getSubTree(
                                patternTree[targetProp],
                                targetTree[targetProp],
                                matchTree[targetProp]
                            );
                        }
                    }
                }
            } else {
                // Match members
                //console.log("MEMBER!");
                if (targetProp == "*") {
                    for (let targetProp in targetTree) {
                        if (typeof targetTree[targetProp] != "object") cb(targetTree, targetProp)
                    }
                } else {
                    if (targetProp in targetTree) {
                        if (typeof targetTree[targetProp] != "object") cb(targetTree, targetProp)
                    }
                }
            }
        }
        return matchTree;
    }
    getSubTree(patternTree: any, targetTree: any = this.root, matchTree: any = {}) {
        for (let matchProp in patternTree) {
            if (typeof patternTree[matchProp] == "object") {
                //console.log("-> Check", matchProp);
                // Match objects
                if (matchProp == "**") {
                    for (let destProp in targetTree) {
                        if (typeof targetTree[destProp] == "object") {
                            matchTree[destProp] = {};
                            this.getSubTree(
                                patternTree[matchProp],
                                targetTree[destProp],
                                matchTree[destProp]
                            );
                        }
                    }
                } else {
                    if (matchProp in targetTree) {
                        if (typeof targetTree[matchProp] == "object") {
                            matchTree[matchProp] = {};
                            this.getSubTree(
                                patternTree[matchProp],
                                targetTree[matchProp],
                                matchTree[matchProp]
                            );
                        }
                    }
                }
            } else {
                // Match members
                //console.log("MEMBER!");
                if (matchProp == "*") {
                    for (let destProp in targetTree) {
                        if (typeof targetTree[destProp] != "object")
                            matchTree[destProp] = targetTree[destProp];
                    }
                } else {
                    if (matchProp in targetTree) {
                        if (typeof targetTree[matchProp] != "object")
                            matchTree[matchProp] = targetTree[matchProp];
                    }
                }
            }
        }
        return matchTree;
    }
    subscribe(patternTree: any) {

    }
    /**
     * Set value (persisting last "state")
     * @example set("ari.log", "LogEntry!") 
    */
    set(path: string | string[], value: any) {
        if (typeof (path) == "string") path = path.split(".")
    }
    /**
     * Emit event (NOT persisting last "state")
     * @example emit("ari.log", "LogEntry!") 
    */
    emit(path: string | string[], value: any) {
        if (typeof (path) == "string") path = path.split(".")
    }
    /**
     * Log a change (persisting all last "states")
     * @example emit("ari.log", "LogEntry!") 
    */
    next(path: string | string[], value: any) {
        if (typeof (path) == "string") path = path.split(".")
    }
}
