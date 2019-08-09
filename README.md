# ARI - design notes

## ARI-object (tree-node)

### Requirements:
* Only subscribe and hence transfer data (subjects/streams/etc.) when required, e.g. there are subscribers to it.
    Store all subscriptions locally and only subscribe/unsigbscribe to remote subjects once when first/last local subscriber subscribes/unsubscribes. 
        (*-subscriptions might create redundant transfers?)
        
* Object tree must be seriazable to JSON
	* TODO: Implement getState/setState functions, getting state recursively from object tree.
	* TODO: Implement object type store for recreation of state with right types.
* State + change notification using JSON porotocol
	* DONE: Use pub/sub functions taking textual paths
* Ease use in objects
	* TODO? Provide helper functions?
* TODO: Optimized protocol for short messages
    * Use object identifiers instead of paths for change notifications.

### SCHEMA for managing reactive model tree!

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
