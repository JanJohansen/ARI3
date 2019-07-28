import { AriClient } from "./common/AriClient"

export class TestClient {
    ari: AriClient
    constructor() {
        this.ari = new AriClient("TestClient")
        this.setup().then(() => { })
    }
    async setup() {
        console.log("Running devTests!")
        let ari = this.ari
        ari.define("_", {
            description: "433MHz Gateway",
            ins: { in1: { description: "Input 1" } },
            outs: { out1: { v: 42, description: "Output 1" } },
            calls: { call1: { description: "Testcall. Returns provided args." } }
        })
        console.log("*********** Defined GW433")
        console.log(JSON.stringify(this.ari.ariModel, this.__jsonReplacer, 2))

        ari.define("_.switch1", {
            description: "433MHz switch",
            ins: { state: { description: "state" } },
            calls: { testCall: { description: "Testcall. Returns provided args." } }
        })
        console.log("*********** Defined switch1 on GW433")
        console.log(JSON.stringify(this.ari.ariModel, this.__jsonReplacer, 2))

        /*
        Idea: EventEmitter2 like interface*/
        // let ariLocal: any
        // aiLocal = {
        //     _:
        //     {
        //         description: "433MHz Gateway",
        //         ins: { in1: { description: "Input 1" } },
        //         outs: { out1: { v: 42, description: "Output 1" } },
        //         calls: { call1: { description: "Testcall. Returns provided args." } }
        //     }
        // })
        // a.set({ "_.connection": { description: "WssClient!" } })



        // ari.delete("_.switch1") // delete child!
        // console.log("*********** Deleted switch")
        // console.log(JSON.stringify(this.ari.local, this.__jsonReplacer, 2))

        // Handlers - only allowed for own "local" model tree
        ari.onCall("_.switch1:testCall", async (args) => { console.log("testCall called w. args:", args); return 42 })
        console.log("*********** Set callback for testCall on GW433.switch")
        console.log(JSON.stringify(this.ari.ariModel, this.__jsonReplacer, 2))

        ari.onIn("_.switch1:state", val => { })
        console.log("*********** Set callback for state input on GW433.switch")
        console.log(JSON.stringify(this.ari.ariModel, this.__jsonReplacer, 2))

        ari.setOut("_:out1", 4242)
        console.log("*********** Set output out1 of GW433")
        console.log(JSON.stringify(this.ari.ariModel, this.__jsonReplacer, 2))

        //------------------------------------------------------------------------------
        // Remote interactions used when acting as a "Controller"...

        let result = await ari.getInfo("_", model => { })
        console.log("*********** GetInfo **.**")
        console.log(JSON.stringify(result, this.__jsonReplacer, 2))

        result = await ari.call("_.switch1:testCall", "yes")
        console.log("*********** Call _.testCall('yes')")
        console.log(JSON.stringify(result, this.__jsonReplacer, 2))


        // ari.onOut("ZigBeeGW.Motion1:presence", v => {
        //     ari.setIn("HueGW.Lamp1:brightness", v)
        // })

        // Subscription!
        // On change, return json object with path to subscription targets + subscribed values. Allows building "mirror trees"...
        // ari.sub("**:**", tree => { }) // Stream everything!
        // ari.sub("**:outs.out1.v", tree => { }, {}) // Stream value v of outputs called out1 of all nodes
        // ari.sub("**:outs.out1+out2.v+ts", tree => { }) // Idea: Could "stream" multiple values on multiple outputs on matching objects - {v: 42, ts: ...} for out1 and out2
        // ari.sub("**:outs.out1.*", tree => { }) // Will "stream" {v: 42, ts: ..., rev: ..., ...}
        // ari.sub("**:ins.*", tree => { }) // Stream any changes in input descriptions! E.g. {description: ..., } allso added/removed inputs!
        // ari.sub("**:children.*", tree => { }) // Stream any added/removed children... Will stream {GW433:{}, ...}
        // ari.sub("devices.*:outs.out1._history", () => { }, { tsRange: [0, 0xffff] })
    }
    //------------------
    // Support functions
    private __jsonReplacer(key: string, value: any) {
        if (key.startsWith("__")) return "<hidden>"
        else return value
    }
}


/*
{
  "__parent": "<hidden>",
  "name": "TestClient",
  "description": "433MHz Gateway",
  "ins": {
    "in1": {
      "description": "Input 1"
    }
  },
  "outs": {
    "out1": {
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
          "__cb": "<hidden>"
        }
      }
    }
  }
}

*/