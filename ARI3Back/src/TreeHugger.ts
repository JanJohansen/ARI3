

/* 
    TODO: API should support "pathToValue" as parameter like:
        JSON notation e.g. an object like sub({Devices:{device1:{property1:value}}}, ...)
        dot-delimeted string  e.g. "Devices.device1.property1"
        API should also be reachable by code (possibly proxy object traversing to target object)
            E.g. root.Devices.device1.property1.sub(()=>{...})
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
}
