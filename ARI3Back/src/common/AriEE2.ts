// /*!
//  * EventEmitter2
//  * https://github.com/hij1nx/EventEmitter2
//  *
//  * Copyright (c) 2013 hij1nx
//  * Licensed under the MIT license.
//  */
// class AriEE2{ 
//     isArray = Array.isArray	? Array.isArray	: function _isArray(obj: any) {
//         return Object.prototype.toString.call(obj) === "[object Array]"
//     }
//     defaultMaxListeners = 10
//     _conf: any
//     _events: {}
//     listenerTree: {}
//     delimiter = "."
//     wildcard = "*"
//     _newListener: boolean
//     _removeListener: boolean
//     verboseMemoryLeak: boolean
    
//     constructor(conf: any) {
//         this._events = {}
//         this._newListener = false
//         this._removeListener = false
//         this.verboseMemoryLeak = false
//         this.configure(conf)
//     }
    
//     init() {
// 		this._events = {}
// 		if (this._conf) {
// 			this.configure(this._conf)
// 		}
// 	}

// 	configure(conf: any) {
// 		if (conf) {
// 			this._conf = conf

// 			conf.delimiter && (this.delimiter = conf.delimiter)

// 			conf.wildcard && (this.wildcard = conf.wildcard)
// 			conf.newListener && (this._newListener = conf.newListener)
// 			conf.removeListener && (this._removeListener = conf.removeListener)
// 			conf.verboseMemoryLeak && (this.verboseMemoryLeak = conf.verboseMemoryLeak)

// 			this.listenerTree = {}
// 		} else {
// 		}
// 	}

// 	//
// 	// Attention, function return type now is array, always !
// 	// It has zero elements if no any matches found and one or more
// 	// elements (leafs) if there are matches
// 	//
// 	searchListenerTree(handlers, tPath: string[], sTree: any, pathId) {
// 		if (!sTree) {
// 			return []
// 		}
// 		var listeners = [],
// 			leaf,
// 			len,
// 			branch,
// 			xTree,
// 			xxTree,
// 			isolatedBranch,
// 			endReached,
// 			typeLength = tPath.length,
// 			currentType = tPath[pathId],
// 			nextType = tPath[pathId + 1]
// 		if (pathId === typeLength && sTree._listeners) {
// 			//
// 			// If at the end of the event(s) list and the tree has listeners
// 			// invoke those listeners.
// 			//
// 			if (typeof sTree._listeners === "function") {
// 				handlers && handlers.push(sTree._listeners)
// 				return [sTree]
// 			} else {
// 				for (leaf = 0, len = sTree._listeners.length; leaf < len; leaf++) {
// 					handlers && handlers.push(sTree._listeners[leaf])
// 				}
// 				return [sTree]
// 			}
// 		}

// 		if (currentType === "*" || currentType === "**" || sTree[currentType]) {
// 			//
// 			// If the event emitted is '*' at this part
// 			// or there is a concrete match at this patch
// 			//
// 			if (currentType === "*") {
// 				for (branch in sTree) {
// 					if (branch !== "_listeners" && sTree.hasOwnProperty(branch)) {
// 						listeners = listeners.concat(this.searchListenerTree(handlers, tPath, sTree[branch], pathId + 1))
// 					}
// 				}
// 				return listeners
// 			} else if (currentType === "**") {
// 				endReached = pathId + 1 === typeLength || (pathId + 2 === typeLength && nextType === "*")
// 				if (endReached && sTree._listeners) {
// 					// The next element has a _listeners, add it to the handlers.
// 					listeners = listeners.concat(this.searchListenerTree(handlers, tPath, sTree, typeLength))
// 				}

// 				for (branch in sTree) {
// 					if (branch !== "_listeners" && sTree.hasOwnProperty(branch)) {
// 						if (branch === "*" || branch === "**") {
// 							if (sTree[branch]._listeners && !endReached) {
// 								listeners = listeners.concat(this.searchListenerTree(handlers, tPath, sTree[branch], typeLength))
// 							}
// 							listeners = listeners.concat(this.searchListenerTree(handlers, tPath, sTree[branch], pathId))
// 						} else if (branch === nextType) {
// 							listeners = listeners.concat(this.searchListenerTree(handlers, tPath, sTree[branch], pathId + 2))
// 						} else {
// 							// No match on this one, shift into the tree but not in the type array.
// 							listeners = listeners.concat(this.searchListenerTree(handlers, tPath, sTree[branch], pathId))
// 						}
// 					}
// 				}
// 				return listeners
// 			}

// 			listeners = listeners.concat(this.searchListenerTree(handlers, tPath, sTree[currentType], pathId + 1))
// 		}

// 		xTree = sTree["*"]
// 		if (xTree) {
// 			//
// 			// If the listener tree will allow any match for this part,
// 			// then recursively explore all branches of the tree
// 			//
// 			this.searchListenerTree(handlers, tPath, xTree, pathId + 1)
// 		}

// 		xxTree = sTree["**"]
// 		if (xxTree) {
// 			if (pathId < typeLength) {
// 				if (xxTree._listeners) {
// 					// If we have a listener on a '**', it will catch all, so add its handler.
// 					this.searchListenerTree(handlers, tPath, xxTree, typeLength)
// 				}

// 				// Build arrays of matching next branches and others.
// 				for (branch in xxTree) {
// 					if (branch !== "_listeners" && xxTree.hasOwnProperty(branch)) {
// 						if (branch === nextType) {
// 							// We know the next element will match, so jump twice.
// 							this.searchListenerTree(handlers, tPath, xxTree[branch], pathId + 2)
// 						} else if (branch === currentType) {
// 							// Current node matches, move into the tree.
// 							this.searchListenerTree(handlers, tPath, xxTree[branch], pathId + 1)
// 						} else {
// 							let isolatedBranch: any = {}
// 							isolatedBranch[branch] = xxTree[branch]
// 							this.searchListenerTree(handlers, tPath, { "**": isolatedBranch }, pathId + 1)
// 						}
// 					}
// 				}
// 			} else if (xxTree._listeners) {
// 				// We have reached the end and still on a '**'
// 				this.searchListenerTree(handlers, tPath, xxTree, typeLength)
// 			} else if (xxTree["*"] && xxTree["*"]._listeners) {
// 				this.searchListenerTree(handlers, tPath, xxTree["*"], typeLength)
// 			}
// 		}

// 		return listeners
// 	}

// 	growListenerTree(type, listener) {
// 		type = typeof type === "string" ? type.split(this.delimiter) : type.slice()

// 		//
// 		// Looks for two consecutive '**', if so, don't add the event at all.
// 		//
// 		for (var i = 0, len = type.length; i + 1 < len; i++) {
// 			if (type[i] === "**" && type[i + 1] === "**") {
// 				return
// 			}
// 		}

// 		var tree = this.listenerTree
// 		var name = type.shift()

// 		while (name !== undefined) {
// 			if (!tree[name]) {
// 				tree[name] = {}
// 			}

// 			tree = tree[name]

// 			if (type.length === 0) {
// 				if (!tree._listeners) {
// 					tree._listeners = listener
// 				} else {
// 					if (typeof tree._listeners === "function") {
// 						tree._listeners = [tree._listeners]
// 					}

// 					tree._listeners.push(listener)

// 					if (!tree._listeners.warned && this._maxListeners > 0 && tree._listeners.length > this._maxListeners) {
// 						tree._listeners.warned = true
// 						logPossibleMemoryLeak.call(this, tree._listeners.length, name)
// 					}
// 				}
// 				return true
// 			}
// 			name = type.shift()
// 		}
// 		return true
// 	}

// 	once(event, fn) {
//         return this._once(event, fn, false)
// 	}
    
// 	prependOnceListener = function(event, fn) {
//         return this._once(event, fn, true)
// 	}
    
// 	_once = function(event, fn, prepend) {
//         this._many(event, 1, fn, prepend)
// 		return this
// 	}
    
// 	many = function(event, ttl, fn) {
//         return this._many(event, ttl, fn, false)
// 	}
    
// 	prependMany = function(event, ttl, fn) {
//         return this._many(event, ttl, fn, true)
// 	}
    
// 	_many = function(event, ttl, fn, prepend) {
//         var self = this
        
// 		if (typeof fn !== "function") {
//             throw new Error("many only accepts instances of Function")
// 		}
        
// 		function listener() {
//             if (--ttl === 0) {
//                 self.off(event, listener)
// 			}
// 			return fn.apply(this, arguments)
// 		}
        
// 		listener._origin = fn
        
// 		this._on(event, listener, prepend)
        
// 		return self
// 	}
    
// 	emit = function() {
//         this._events || init.call(this)
        
// 		var type = arguments[0]
        
// 		if (type === "newListener" && !this._newListener) {
//             if (!this._events.newListener) {
//                 return false
// 			}
// 		}
        
// 		var al = arguments.length
// 		var args, l, i, j
// 		var handler
        
// 		if (this._all && this._all.length) {
//             handler = this._all.slice()
// 			if (al > 3) {
//                 args = new Array(al)
// 				for (j = 0; j < al; j++) args[j] = arguments[j]
// 			}
            
// 			for (i = 0, l = handler.length; i < l; i++) {
//                 this.event = type
// 				switch (al) {
//                     case 1:
//                     handler[i].call(this, type)
//                     break
// 					case 2:
//                     handler[i].call(this, type, arguments[1])
//                     break
// 					case 3:
//                     handler[i].call(this, type, arguments[1], arguments[2])
//                     break
// 					default:
//                     handler[i].apply(this, args)
// 				}
// 			}
// 		}
        
// 		if (this.wildcard) {
//             handler = []
// 			var ns = typeof type === "string" ? type.split(this.delimiter) : type.slice()
// 			this.searchListenerTree.call(this, handler, ns, this.listenerTree, 0)
// 		} else {
//             handler = this._events[type]
// 			if (typeof handler === "function") {
// 				this.event = type
// 				switch (al) {
// 					case 1:
// 						handler.call(this)
// 						break
// 					case 2:
// 						handler.call(this, arguments[1])
// 						break
// 					case 3:
// 						handler.call(this, arguments[1], arguments[2])
// 						break
// 					default:
// 						args = new Array(al - 1)
// 						for (j = 1; j < al; j++) args[j - 1] = arguments[j]
// 						handler.apply(this, args)
// 				}
// 				return true
// 			} else if (handler) {
// 				// need to make copy of handlers because list can change in the middle
// 				// of emit call
// 				handler = handler.slice()
// 			}
// 		}

// 		if (handler && handler.length) {
// 			if (al > 3) {
// 				args = new Array(al - 1)
// 				for (j = 1; j < al; j++) args[j - 1] = arguments[j]
// 			}
// 			for (i = 0, l = handler.length; i < l; i++) {
// 				this.event = type
// 				switch (al) {
// 					case 1:
// 						handler[i].call(this)
// 						break
// 					case 2:
// 						handler[i].call(this, arguments[1])
// 						break
// 					case 3:
// 						handler[i].call(this, arguments[1], arguments[2])
// 						break
// 					default:
// 						handler[i].apply(this, args)
// 				}
// 			}
// 			return true
// 		} else if (!this._all && type === "error") {
// 			if (arguments[1] instanceof Error) {
// 				throw arguments[1] // Unhandled 'error' event
// 			} else {
// 				throw new Error("Uncaught, unspecified 'error' event.")
// 			}
// 			return false
// 		}

// 		return !!this._all
// 	}

// 	emitAsync = function() {
// 		this._events || init.call(this)

// 		var type = arguments[0]

// 		if (type === "newListener" && !this._newListener) {
// 			if (!this._events.newListener) {
// 				return Promise.resolve([false])
// 			}
// 		}

// 		var promises = []

// 		var al = arguments.length
// 		var args, l, i, j
// 		var handler

// 		if (this._all) {
// 			if (al > 3) {
// 				args = new Array(al)
// 				for (j = 1; j < al; j++) args[j] = arguments[j]
// 			}
// 			for (i = 0, l = this._all.length; i < l; i++) {
// 				this.event = type
// 				switch (al) {
// 					case 1:
// 						promises.push(this._all[i].call(this, type))
// 						break
// 					case 2:
// 						promises.push(this._all[i].call(this, type, arguments[1]))
// 						break
// 					case 3:
// 						promises.push(this._all[i].call(this, type, arguments[1], arguments[2]))
// 						break
// 					default:
// 						promises.push(this._all[i].apply(this, args))
// 				}
// 			}
// 		}

// 		if (this.wildcard) {
// 			handler = []
// 			var ns = typeof type === "string" ? type.split(this.delimiter) : type.slice()
// 			this.searchListenerTree.call(this, handler, ns, this.listenerTree, 0)
// 		} else {
// 			handler = this._events[type]
// 		}

// 		if (typeof handler === "function") {
// 			this.event = type
// 			switch (al) {
// 				case 1:
// 					promises.push(handler.call(this))
// 					break
// 				case 2:
// 					promises.push(handler.call(this, arguments[1]))
// 					break
// 				case 3:
// 					promises.push(handler.call(this, arguments[1], arguments[2]))
// 					break
// 				default:
// 					args = new Array(al - 1)
// 					for (j = 1; j < al; j++) args[j - 1] = arguments[j]
// 					promises.push(handler.apply(this, args))
// 			}
// 		} else if (handler && handler.length) {
// 			handler = handler.slice()
// 			if (al > 3) {
// 				args = new Array(al - 1)
// 				for (j = 1; j < al; j++) args[j - 1] = arguments[j]
// 			}
// 			for (i = 0, l = handler.length; i < l; i++) {
// 				this.event = type
// 				switch (al) {
// 					case 1:
// 						promises.push(handler[i].call(this))
// 						break
// 					case 2:
// 						promises.push(handler[i].call(this, arguments[1]))
// 						break
// 					case 3:
// 						promises.push(handler[i].call(this, arguments[1], arguments[2]))
// 						break
// 					default:
// 						promises.push(handler[i].apply(this, args))
// 				}
// 			}
// 		} else if (!this._all && type === "error") {
// 			if (arguments[1] instanceof Error) {
// 				return Promise.reject(arguments[1]) // Unhandled 'error' event
// 			} else {
// 				return Promise.reject("Uncaught, unspecified 'error' event.")
// 			}
// 		}

// 		return Promise.all(promises)
// 	}

// 	on = function(type, listener) {
// 		return this._on(type, listener, false)
// 	}

// 	prependListener = function(type, listener) {
// 		return this._on(type, listener, true)
// 	}

// 	onAny = function(fn) {
// 		return this._onAny(fn, false)
// 	}

// 	prependAny = function(fn) {
// 		return this._onAny(fn, true)
// 	}

// 	addListener = this.on

// 	_onAny = function(fn, prepend) {
// 		if (typeof fn !== "function") {
// 			throw new Error("onAny only accepts instances of Function")
// 		}

// 		if (!this._all) {
// 			this._all = []
// 		}

// 		// Add the function to the event listener collection.
// 		if (prepend) {
// 			this._all.unshift(fn)
// 		} else {
// 			this._all.push(fn)
// 		}

// 		return this
// 	}

// 	_on = function(type, listener, prepend) {
// 		if (typeof type === "function") {
// 			this._onAny(type, listener)
// 			return this
// 		}

// 		if (typeof listener !== "function") {
// 			throw new Error("on only accepts instances of Function")
// 		}
// 		this._events || init.call(this)

// 		// To avoid recursion in the case that type == "newListeners"! Before
// 		// adding it to the listeners, first emit "newListeners".
// 		if (this._newListener) this.emit("newListener", type, listener)

// 		if (this.wildcard) {
// 			this.growListenerTree.call(this, type, listener)
// 			return this
// 		}

// 		if (!this._events[type]) {
// 			// Optimize the case of one listener. Don't need the extra array object.
// 			this._events[type] = listener
// 		} else {
// 			if (typeof this._events[type] === "function") {
// 				// Change to array.
// 				this._events[type] = [this._events[type]]
// 			}

// 			// If we've already got an array, just add
// 			if (prepend) {
// 				this._events[type].unshift(listener)
// 			} else {
// 				this._events[type].push(listener)
// 			}

// 			// Check for listener leak
// 			if (!this._events[type].warned && this._maxListeners > 0 && this._events[type].length > this._maxListeners) {
// 				this._events[type].warned = true
// 				// logPossibleMemoryLeak.call(this, this._events[type].length, type)
// 			}
// 		}

// 		return this
// 	}

// 	off = function(type, listener) {
// 		if (typeof listener !== "function") {
// 			throw new Error("removeListener only takes instances of Function")
// 		}

// 		var handlers,
// 			leafs = []

// 		if (this.wildcard) {
// 			var ns = typeof type === "string" ? type.split(this.delimiter) : type.slice()
// 			leafs = this.searchListenerTree.call(this, null, ns, this.listenerTree, 0)
// 		} else {
// 			// does not use listeners(), so no side effect of creating _events[type]
// 			if (!this._events[type]) return this
// 			handlers = this._events[type]
// 			leafs.push({ _listeners: handlers })
// 		}

// 		for (var iLeaf = 0; iLeaf < leafs.length; iLeaf++) {
// 			var leaf = leafs[iLeaf]
// 			handlers = leaf._listeners
// 			if (this.isArray(handlers)) {
// 				var position = -1

// 				for (var i = 0, length = handlers.length; i < length; i++) {
// 					if (
// 						handlers[i] === listener ||
// 						(handlers[i].listener && handlers[i].listener === listener) ||
// 						(handlers[i]._origin && handlers[i]._origin === listener)
// 					) {
// 						position = i
// 						break
// 					}
// 				}

// 				if (position < 0) {
// 					continue
// 				}

// 				if (this.wildcard) {
// 					leaf._listeners.splice(position, 1)
// 				} else {
// 					this._events[type].splice(position, 1)
// 				}

// 				if (handlers.length === 0) {
// 					if (this.wildcard) {
// 						delete leaf._listeners
// 					} else {
// 						delete this._events[type]
// 					}
// 				}
// 				if (this._removeListener) this.emit("removeListener", type, listener)

// 				return this
// 			} else if (
// 				handlers === listener ||
// 				(handlers.listener && handlers.listener === listener) ||
// 				(handlers._origin && handlers._origin === listener)
// 			) {
// 				if (this.wildcard) {
// 					delete leaf._listeners
// 				} else {
// 					delete this._events[type]
// 				}
// 				if (this._removeListener) this.emit("removeListener", type, listener)
// 			}
// 		}

// 		function recursivelyGarbageCollect(root) {
// 			if (root === undefined) {
// 				return
// 			}
// 			var keys = Object.keys(root)
// 			for (var i in keys) {
// 				var key = keys[i]
// 				var obj = root[key]
// 				if (obj instanceof Function || typeof obj !== "object" || obj === null) continue
// 				if (Object.keys(obj).length > 0) {
// 					recursivelyGarbageCollect(root[key])
// 				}
// 				if (Object.keys(obj).length === 0) {
// 					delete root[key]
// 				}
// 			}
// 		}
// 		recursivelyGarbageCollect(this.listenerTree)

// 		return this
// 	}

// 	offAny = function(fn) {
// 		var i = 0,
// 			l = 0,
// 			fns
// 		if (fn && this._all && this._all.length > 0) {
// 			fns = this._all
// 			for (i = 0, l = fns.length; i < l; i++) {
// 				if (fn === fns[i]) {
// 					fns.splice(i, 1)
// 					if (this._removeListener) this.emit("removeListenerAny", fn)
// 					return this
// 				}
// 			}
// 		} else {
// 			fns = this._all
// 			if (this._removeListener) {
// 				for (i = 0, l = fns.length; i < l; i++) this.emit("removeListenerAny", fns[i])
// 			}
// 			this._all = []
// 		}
// 		return this
// 	}

// 	removeListener = this.off

// 	removeAllListeners = function(type) {
// 		if (type === undefined) {
// 			!this._events || init.call(this)
// 			return this
// 		}

// 		if (this.wildcard) {
// 			var ns = typeof type === "string" ? type.split(this.delimiter) : type.slice()
// 			var leafs = this.searchListenerTree.call(this, null, ns, this.listenerTree, 0)

// 			for (var iLeaf = 0; iLeaf < leafs.length; iLeaf++) {
// 				var leaf = leafs[iLeaf]
// 				leaf._listeners = null
// 			}
// 		} else if (this._events) {
// 			this._events[type] = null
// 		}
// 		return this
// 	}

// 	listeners = function(type) {
// 		if (this.wildcard) {
// 			var handlers = []
// 			var ns = typeof type === "string" ? type.split(this.delimiter) : type.slice()
// 			this.searchListenerTree.call(this, handlers, ns, this.listenerTree, 0)
// 			return handlers
// 		}

// 		this._events || init.call(this)

// 		if (!this._events[type]) this._events[type] = []
// 		if (!this.isArray(this._events[type])) {
// 			this._events[type] = [this._events[type]]
// 		}
// 		return this._events[type]
// 	}

// 	eventNames = function() {
// 		return Object.keys(this._events)
// 	}

// 	listenerCount = function(type) {
// 		return this.listeners(type).length
// 	}

// 	listenersAny = function() {
// 		if (this._all) {
// 			return this._all
// 		} else {
// 			return []
// 		}
// 	}
// }