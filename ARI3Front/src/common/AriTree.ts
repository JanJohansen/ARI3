
// NOTE TO SELF!: Source is in ARI3Front!

/*
let model = {
	node: {
		val: 42,
		[subsSym]: {
			val: {
				subId0: {
					cb: ()=>{},
					context: {}
				}
			}
		}
	}
}
						sub(".") 		sub(".*")			sub(".**")
HueGW					{Lamp:{}}		{Lamp: {}}			{Lamp: {brightness: 1}}
	Lamp				{brightness: 1}	{brightness: 1}		{brightness: 1}
		brightness		1				?					?

*/
const subsSym = Symbol("subsSym")
const storePathSym = Symbol("storePathSym")

export class AriNode {
	static nextSubId = 0
	// [name: string]: AriObjectModel | Function // TypeScript: May contain any names for child relations!
	log(...args: any): void { console.log(...args) }

	pub(path: string | string[], value: any, storePath = true, storeValue = true) {
		this.log('! Setting:', path, '=', value)
		let found = this.findNode(path, storePath)
		if (found) {
			let node = found.node
			let name = found.name
			if (storeValue) node[name] = value

			// Call subscribers
			let subs = node[subsSym];
			if (subs) {
				let elementSubs = subs[name];
				for (let subId in elementSubs) {
					elementSubs[subId].cb(value, elementSubs[subId].context);
				}
			}
			node.callStarSubsribers();
		}
	}
	private callStarSubsribers() {
		this.log("callStarSubs")
		let subs = this[subsSym];
		if (subs) {
			// Check for * subscription
			let elementSubs = subs["*"];
			if (elementSubs) {
				let val: any = {};
				for (let p in this) {
					if (typeof (this[p]) == "object") val[p] = {};
					else if (typeof (this[p]) != "function") val[p] = this[p];
				}
				for (let subId in elementSubs) {
					elementSubs[subId].cb(val, elementSubs[subId].context);
				}
			}
			// TODO: Implement ** subscription
			// Check for ** subscription
			// elementSubs = subs["**"];
			// if (elementSubs) {
			// 	for (let subId in elementSubs) {
			// 		elementSubs[subId].cb(this, elementSubs[subId].context);
			// 	}
			// }
		}
	}
	sub(path: string | string[], cb: (value: any, subscriptionContext: any) => void, subscriptionContext: any = undefined, storePath = true): number | null {
		let found = this.findNode(path, storePath)
		if (found) {
			let node = found.node
			let name = found.name
			// Call cb if value available!
			if (name in node) {
				cb(node[name], subscriptionContext)
			}

			// Set subscription.
			if (!(subsSym in node)) node[subsSym] = {}	// Create if not exists
			let subs = node[subsSym]
			if (!(name in subs)) subs[name] = {}
			let elementSubs = subs[name]
			elementSubs[AriNode.nextSubId] = { cb, context: subscriptionContext }
			return AriNode.nextSubId++
		} else return null
	}
	findNode(path: string | string[], storePath = true): { node: AriNode, name: string } | null {
		this.log('! Finding', path)
		path = typeof path == 'string' ? path.split('.') : path.slice()

		let node = this
		let pathIdx = 0
		let name = path[pathIdx++]
		while (name !== undefined) {
			if (pathIdx == path.length) {
				// Subscription target object found. (Parent of member to find!)
				return { node, name }
			} else {
				if (!(name in node)) {
					node[name] = new AriNode() // Create path if not existing.
					node.callStarSubsribers()
					if (!storePath) node[name][storePathSym] = false
				}
			}
			node = node[name]
			name = path[pathIdx++]
		}
		return null
	}
	dumpModel() {
		// console.log(JSON.stringify(this, null, 2))
		console.log(this)
	}
	unsub(subId: number) {
		// Hmmm...Iterate or make index?

	}
	getState(): any {

	}
	setState(state: any) {

	}
}

export class AriModel_old {
	static const valueSym = Symbol("valueSym")
	static const subsSym = Symbol("valueSym")
	model: any = {}
	static nextSubId = 0
	log(...args: any): void { console.log(...args) }
	constructor(name: string) {

	}
	//-------------------------------------------------------------------------
	// Public API
	/**
	 * Set "topic" to a value.
	 */
	pub(path: string | string[], value: any, storePath = true, storeValue = true) {
		this.log('! Setting:', path, '=', value)
		path = typeof path == 'string' ? path.split('.') : path.slice()

		let node = this.model
		let pathId = 0
		let name = path[pathId++]
		while (name !== undefined) {
			if (!node[name]) {
				if (storePath) node[name] = {} // Create path if not existing.
				else return
			}
			if (pathId == path.length) {
				// Target path found. Store value *on object*!
				if (!storeValue) node[name][AriNode.valueSym] = value

				// Call subscribers
				if (node[name][subsSym]) {

				}
			} else {
				// Move along path
				node = node[name]
			}
			name = path[pathId++]
		}
	}
	/**
	 * Subscribe to model changes.
	 * Returns symbol identifying subscription, or null if subscription failed (e.g. storePath=false and path not found!)
	 */
	sub(path: string | string[], cb: (value: any, subscriptionContext: any) => void, subscriptionContext: any = undefined, storePath = true): number | null {
		this.log(`! Subscribing to: ${path}`)
		path = typeof path == 'string' ? path.split('.') : path.slice()

		let node = this.model
		let pathId = 0
		let name = path[pathId++]
		while (name !== undefined) {
			if (!(name in node)) {
				if (storePath) node[name] = {} // Create path if not existing.
				else return null
			}
			if (pathId == path.length) {
				// Target path found.
				if (name in node) {

				}

				// Call subscribers

				return this.nextSubId++
			} else {
				// Move along path
				node = node[name]
			}
			name = path[pathId++]
		}
	}
	/**
	 * UnSubscribe to previous subscription.
	 */
	unsub(subscriptionId: number) {

	}
	/**
	 * Delete tree branch from and including end of specified path!
	 * @param path 
	 */
	delete(path: string | string[]) {

	}
	/**
	 * Call function
	 * @param path 
	 * @param args 
	 */
	async call(path: string[], args: any = null): Promise<any> {
		return null
	}
	/**
	 * Define and register callback for function call
	 */
	onCall() {

	}
	//-------------------------------------------------------------------------
	// Helpers
	/**
	 * Apply Patch Tree to Value Tree
	 */
	private setValue(path: string[], value: any) {
		let node = this.model
		let pathId = 0
		let name = path[pathId++]
		while (name !== undefined) {
			if (!node[name]) {
				node[name] = {} // Create path if not existing.
			}
			if (pathId == path.length) {
				// Create or overwrite value
				node[name] = value
				return true
			} else {
				// Move along path
				node = node[name]
			}
			name = path[pathId++]
		}
	}
	getValueTree(path: string[], resultNode: any, values: any[], pathId: number = 0, vTree: any = this.model) {
		//TODO: Support **
		let pName = path[pathId]
		for (let vProp in vTree) {
			if (!vProp.startsWith('__')) {
				if (pName == vProp) {
					pathId++
					if (pathId < path.length) {
						let subResult = {}
						if (this.getValueTree(path, subResult, values, pathId, vTree[vProp])) {
							resultNode[vProp] = subResult
							return true
						} else return false
					} else {
						resultNode[vProp] = vTree[vProp]
						values.push(vTree[vProp])
						return true
					}


					if (path[pathId] == "**") {
						if (path[pathId + 1]) {
							if (path[pathId + 1] in vTree[vProp]) pathId++
						}
					} else pathId++
				}
			}
		}
		return false
	}
	addToSubTree(path: string | string[], subId: number) {
		path = typeof path == 'string' ? path.split('.') : path.slice()

		var tree = this.sTree
		var name = path.shift()

		while (name !== undefined) {
			if (!tree[name]) tree[name] = {}
			tree = tree[name]

			if (path.length == 0) {
				if (!tree._subIds) tree._subIds = []
				tree._subIds.push(subId)
				return true
			}
			name = path.shift()
		}
	}
	/** Get list of subscribers in sTree matching mPath (Match Path). 
	* @Credit Modified from the brilliant EventEmitter2.
	*/
	getSubList(tPath: string[], subList: any, pathId: number = 0, sTree: any = this.sTree): number[] {
		this.log(`getSubList ${tPath} ${subList} ${pathId} ${JSON.stringify(sTree)}`)
		let pathLength = tPath.length

		// If at the end of the event(s) list and the tree has subscriptions
		// return those listeners!
		if (pathId == pathLength) {
			if (sTree._subIds) sTree._subIds.forEach((subId: number) => subList.push(subId))
			return [sTree] // Return array of subId arrays to allow deleting them!
		}
		let tProp = tPath[pathId]
		let nextTProp = tPath[pathId + 1]
		let branch
		let subIds: number[] = []
		let endReached
		if (tProp === "*" || tProp === "**" || sTree[tProp]) {
			{
				//
				// If the event emitted is '*' at this part
				// or there is a concrete match at this patch
				//
				// if (tProp === "*") {
				// 	for (branch in sTree) {
				// 		if (branch !== "_subIds" && this.sTree.hasOwnProperty(branch)) {
				// 			subIds = subIds.concat(this.getSubList(tPath, subList, resultTree, pathId + 1, sTree[branch]))
				// 		}
				// 	}
				// 	return subIds
				// } else if (tProp === "**") {
				// 	endReached = pathId + 1 === pathLength || (pathId + 2 === pathLength && nextTProp === "*")
				// 	if (endReached && sTree._listeners) {
				// 		// The next element has a _listeners, add it to the handlers.
				// 		subIds = subIds.concat(this.getSubList(tPath, subList, resultTree, pathLength, sTree))
				// 			// this.getSubList(handlers, tPath, sTree, pathLength))
				// 	}

				// 	for (branch in sTree) {
				// 		if (branch !== "_subId" && sTree.hasOwnProperty(branch)) {
				// 			if (branch === "*" || branch === "**") {
				// 				if (sTree[branch]._listeners && !endReached) {
				// 					subIds = subIds.concat(this.getSubList(tPath, subList, resultTree, pathLength, sTree[branch]))
				// 						// this.getSubList(handlers, tPath, sTree[branch], pathLength))
				// 				}
				// 				subIds = subIds.concat(this.getSubList(tPath, subList, resultTree, pathId, sTree[branch]))
				// 					// this.getSubList(handlers, tPath, sTree[branch], pathId))
				// 			} else if (branch === nextTProp) {
				// 				subIds = subIds.concat(this.getSubList(tPath, subList, resultTree, pathId + 2, sTree[branch]))
				// 					// this.getSubList(handlers, tPath, sTree[branch], pathId + 2))
				// 			} else {
				// 				// No match on this one, shift into the tree but not in the type array.
				// 				subIds = subIds.concat(this.getSubList(tPath, subList, resultTree, pathId, sTree[branch]))
				// 					// this.getSubList(handlers, tPath, sTree[branch], pathId))
				// 			}
				// 		}
				// 	}
				// 	return subIds
				// }
			}
			let resultBranch = {}
			subIds = subIds.concat(this.getSubList(tPath, subList, pathId + 1, sTree[tProp]))
			// this.getSubList(handlers, tPath, sTree[tProp], pathId + 1))
		}

		let xTree = sTree["*"]
		if (xTree) {
			// If the listener tree will allow any match for this part,
			// then recursively explore all branches of the tree
			// this.searchListenerTree(handlers, tPath, xTree, pathId + 1)
			this.getSubList(tPath, subList, pathId + 1, xTree)
		}

		let xxTree = sTree["**"]
		if (xxTree) {
			if (pathId < pathLength) {
				if (xxTree._subIds) {
					// If we have a listener on a '**', it will catch all, so add its handler.
					// this.searchListenerTree(handlers, tPath, xxTree, pathLength)
					this.getSubList(tPath, subList, pathLength, xxTree)
				}
				// Build arrays of matching next branches and others.
				for (branch in xxTree) {
					if (branch !== "_subIds" && xxTree.hasOwnProperty(branch)) {
						if (branch === nextTProp) {
							// We know the next element will match, so jump twice.
							// this.searchListenerTree(handlers, tPath, xxTree[branch], pathId + 2)
							this.getSubList(tPath, subList, pathId + 2, xxTree[branch])
						} else if (branch === tProp) {
							// Current node matches, move into the tree.
							// this.searchListenerTree(handlers, tPath, xxTree[branch], pathId + 1)
							this.getSubList(tPath, subList, pathId + 1, xxTree[branch])
						} else {
							let isolatedBranch: any = {}
							isolatedBranch[branch] = xxTree[branch]
							// this.searchListenerTree(handlers, tPath, { "**": isolatedBranch }, pathId + 1)
							this.getSubList(tPath, subList, pathId + 1, { "**": isolatedBranch })
						}
					}
				}
			} else if (xxTree._subIds) {
				// We have reached the end and still on a '**'
				// this.searchListenerTree(handlers, tPath, xxTree, pathLength)
				this.getSubList(tPath, subList, pathLength, xxTree)
			} else if (xxTree["*"] && xxTree["*"]._subIds) {
				// this.searchListenerTree(handlers, tPath, xxTree["*"], pathLength)
				this.getSubList(tPath, subList, pathLength, xxTree["*"])
			}
		}
		return subIds
	}
	match(pattern: string, target: string) {
		// this.log('Match:', pattern, '~~', target)
		if (pattern.startsWith('*')) return true
		if (target.startsWith('*')) return true
		if (pattern == target) return true
		return false
	}
}

// OLD CODE! (20190726)

// export class AriModel {
// 	vTree: any = {}
// 	sTree: any = {}
// 	nextSubId = 0
// 	log(...args: any): void { console.log(...args) }
// 	subs: { [subId: number]: { cb: (value: any, resultTree: any, extraArgs: any, subId: number) => void; extraArgs: any } } = {}
// 	constructor(name: string) { 

// 	}
// 	//-------------------------------------------------------------------------
// 	// Public API
// 	/**
// 	 * Set "topic" to a value.
// 	 */
// 	set(path: string | string[], value: any, persist: boolean = true) {
// 		this.log('! Setting:', path, '=', value)
// 		path = typeof path == 'string' ? path.split('.') : path.slice()
// 		let resultTree = {}
// 		this.setValueTree(path, value, resultTree)
// 		let subList: number[] = []
// 		this.getSubList(path, subList)
// 		this.log("ResultTree:", JSON.stringify(resultTree))

// 		subList.forEach(subId => {
// 			// this.subs[subId].cb(value, subId, this.subs[subId].extraArgs)
// 			this.log("Calling callback for subId:", subId, "(", value )
// 			this.subs[subId].cb(value, resultTree, this.subs[subId].extraArgs, subId)
// 		});
// 	}
// 	// on(path: string[], context: any, cb: (value: any, context: any)=>void)
// 	on(path: string[], cb: (subId: number, v: any, resultTree: any, extraArgs: any) => void, extraArgs: any = undefined): number {
// 		let subId = this.nextSubId++
// 		this.log(`! Subscribing (subId:${subId}) to:`, path)
// 		this.subs[subId] = { cb, extraArgs }

// 		// Get value tree for this subscription.
// 		let resultTree = {}
// 		let values: any[] = []
// 		this.getValueTree(path, resultTree, values)
// 		//process.nextTick(() => { cb(resultTree, subId, extraArgs) }) // Call cb in next tick to allow propagation of the subId!
// 		cb(values[0], resultTree, extraArgs, subId)

// 		// Add this subscription to subscription tree
// 		this.addToSubTree(path, subId)

// 		return subId
// 	}
// 	/**
// 	 * Delete tree branch from and including end of specified path!
// 	 * @param path 
// 	 */
// 	delete(path: string | string[]) {

// 	}
// 	/**
// 	 * Call function
// 	 * @param path 
// 	 * @param args 
// 	 */
// 	async call(path: string[], args: any = null): Promise<any> {
// 		return null
// 	}
// 	/**
// 	 * Define and register callback for function call
// 	 */
// 	onCall(){

// 	}
// 	//-------------------------------------------------------------------------
// 	// Helpers
// 	/**
// 	 * Apply Patch Tree to Value Tree
// 	 * @param pTree Patch Tree
// 	 * @param vTree Value Tree 
// 	 * @returns 
// 	 * @param rTree Concrete "Result Tree"
// 	 */
// 	private setValueTree(path: string[], value: any, resultTree: any = {}) {
// 		let node = this.vTree
// 		let pathId = 0
// 		let name = path[pathId++]
// 		while (name !== undefined) {
// 			if (!node[name]) {
// 				node[name] = {} // Create path if not existing.
// 				resultTree[name] = {}
// 				resultTree = resultTree[name]
// 			}
// 			if (pathId == path.length) {
// 				// Create or overwrite value
// 				node[name] = value
// 				resultTree[name] = value
// 				return true
// 			} else {
// 				// Move along path
// 				node = node[name]
// 				resultTree[name] = {}
// 				resultTree = resultTree[name]
// 			}
// 			name = path[pathId++]
// 		}
// 	}
// 	getValueTree(path: string[], resultNode: any, values: any[], pathId: number = 0, vTree: any = this.vTree) {
// 		//TODO: Support **
// 		let pName = path[pathId]
// 		for (let vProp in vTree) {
// 			if (!vProp.startsWith('__')) {
// 				if (pName == vProp) {
// 					pathId++
// 					if (pathId < path.length) {
// 						let subResult = {}
// 						if (this.getValueTree(path, subResult, values, pathId, vTree[vProp])) {
// 							resultNode[vProp] = subResult
// 							return true
// 						} else return false
// 					} else {
// 						resultNode[vProp] = vTree[vProp]
// 						values.push(vTree[vProp])
// 						return true
// 					}


// 					if (path[pathId] == "**") {
// 						if (path[pathId + 1]) {
// 							if(path[pathId + 1] in vTree[vProp]) pathId++
// 						}
// 					} else pathId++
// 				}
// 			}
// 		}
// 		return false
// 	}
// 	addToSubTree(path: string | string[], subId: number) {
// 		path = typeof path == 'string' ? path.split('.') : path.slice()

// 		var tree = this.sTree
// 		var name = path.shift()

// 		while (name !== undefined) {
// 			if (!tree[name]) tree[name] = {}
// 			tree = tree[name]

// 			if (path.length == 0) {
// 				if (!tree._subIds) tree._subIds = []
// 				tree._subIds.push(subId)
// 				return true
// 			}
// 			name = path.shift()
// 		}
// 	}
// 	/** Get list of subscribers in sTree matching mPath (Match Path). 
// 	* @Credit Modified from the brilliant EventEmitter2.
// 	*/
// 	getSubList(tPath: string[], subList: any, pathId: number = 0, sTree: any = this.sTree): number[] {
// 		this.log(`getSubList ${tPath} ${subList} ${pathId} ${JSON.stringify(sTree)}`)
// 		let pathLength = tPath.length

// 		// If at the end of the event(s) list and the tree has subscriptions
// 		// return those listeners!
// 		if (pathId == pathLength) {
// 			if (sTree._subIds) sTree._subIds.forEach((subId: number) => subList.push(subId))
// 			return [sTree] // Return array of subId arrays to allow deleting them!
// 		}
// 		let tProp = tPath[pathId]
// 		let nextTProp = tPath[pathId + 1]
// 		let branch
// 		let subIds: number[] = []
// 		let endReached
// 		if (tProp === "*" || tProp === "**" || sTree[tProp]) {
// 			{
// 				//
// 				// If the event emitted is '*' at this part
// 				// or there is a concrete match at this patch
// 				//
// 				// if (tProp === "*") {
// 				// 	for (branch in sTree) {
// 				// 		if (branch !== "_subIds" && this.sTree.hasOwnProperty(branch)) {
// 				// 			subIds = subIds.concat(this.getSubList(tPath, subList, resultTree, pathId + 1, sTree[branch]))
// 				// 		}
// 				// 	}
// 				// 	return subIds
// 				// } else if (tProp === "**") {
// 				// 	endReached = pathId + 1 === pathLength || (pathId + 2 === pathLength && nextTProp === "*")
// 				// 	if (endReached && sTree._listeners) {
// 				// 		// The next element has a _listeners, add it to the handlers.
// 				// 		subIds = subIds.concat(this.getSubList(tPath, subList, resultTree, pathLength, sTree))
// 				// 			// this.getSubList(handlers, tPath, sTree, pathLength))
// 				// 	}

// 				// 	for (branch in sTree) {
// 				// 		if (branch !== "_subId" && sTree.hasOwnProperty(branch)) {
// 				// 			if (branch === "*" || branch === "**") {
// 				// 				if (sTree[branch]._listeners && !endReached) {
// 				// 					subIds = subIds.concat(this.getSubList(tPath, subList, resultTree, pathLength, sTree[branch]))
// 				// 						// this.getSubList(handlers, tPath, sTree[branch], pathLength))
// 				// 				}
// 				// 				subIds = subIds.concat(this.getSubList(tPath, subList, resultTree, pathId, sTree[branch]))
// 				// 					// this.getSubList(handlers, tPath, sTree[branch], pathId))
// 				// 			} else if (branch === nextTProp) {
// 				// 				subIds = subIds.concat(this.getSubList(tPath, subList, resultTree, pathId + 2, sTree[branch]))
// 				// 					// this.getSubList(handlers, tPath, sTree[branch], pathId + 2))
// 				// 			} else {
// 				// 				// No match on this one, shift into the tree but not in the type array.
// 				// 				subIds = subIds.concat(this.getSubList(tPath, subList, resultTree, pathId, sTree[branch]))
// 				// 					// this.getSubList(handlers, tPath, sTree[branch], pathId))
// 				// 			}
// 				// 		}
// 				// 	}
// 				// 	return subIds
// 				// }
// 			}
// 			let resultBranch = {}
// 			subIds = subIds.concat(this.getSubList(tPath, subList, pathId + 1, sTree[tProp]))
// 			// this.getSubList(handlers, tPath, sTree[tProp], pathId + 1))
// 		}

// 		let xTree = sTree["*"]
// 		if (xTree) {
// 			// If the listener tree will allow any match for this part,
// 			// then recursively explore all branches of the tree
// 			// this.searchListenerTree(handlers, tPath, xTree, pathId + 1)
// 			this.getSubList(tPath, subList, pathId + 1, xTree)
// 		}

// 		let xxTree = sTree["**"]
// 		if (xxTree) {
// 			if (pathId < pathLength) {
// 				if (xxTree._subIds) {
// 					// If we have a listener on a '**', it will catch all, so add its handler.
// 					// this.searchListenerTree(handlers, tPath, xxTree, pathLength)
// 					this.getSubList(tPath, subList, pathLength, xxTree)
// 				}
// 				// Build arrays of matching next branches and others.
// 				for (branch in xxTree) {
// 					if (branch !== "_subIds" && xxTree.hasOwnProperty(branch)) {
// 						if (branch === nextTProp) {
// 							// We know the next element will match, so jump twice.
// 							// this.searchListenerTree(handlers, tPath, xxTree[branch], pathId + 2)
// 							this.getSubList(tPath, subList, pathId + 2, xxTree[branch])
// 						} else if (branch === tProp) {
// 							// Current node matches, move into the tree.
// 							// this.searchListenerTree(handlers, tPath, xxTree[branch], pathId + 1)
// 							this.getSubList(tPath, subList, pathId + 1, xxTree[branch])
// 						} else {
// 							let isolatedBranch: any = {}
// 							isolatedBranch[branch] = xxTree[branch]
// 							// this.searchListenerTree(handlers, tPath, { "**": isolatedBranch }, pathId + 1)
// 							this.getSubList(tPath, subList, pathId + 1, { "**": isolatedBranch })
// 						}
// 					}
// 				}
// 			} else if (xxTree._subIds) {
// 				// We have reached the end and still on a '**'
// 				// this.searchListenerTree(handlers, tPath, xxTree, pathLength)
// 				this.getSubList(tPath, subList, pathLength, xxTree)
// 			} else if (xxTree["*"] && xxTree["*"]._subIds) {
// 				// this.searchListenerTree(handlers, tPath, xxTree["*"], pathLength)
// 				this.getSubList(tPath, subList, pathLength, xxTree["*"])
// 			}
// 		}
// 		return subIds
// 	}
// 	match(pattern: string, target: string) {
// 		// this.log('Match:', pattern, '~~', target)
// 		if (pattern.startsWith('*')) return true
// 		if (target.startsWith('*')) return true
// 		if (pattern == target) return true
// 		return false
// 	}
// }