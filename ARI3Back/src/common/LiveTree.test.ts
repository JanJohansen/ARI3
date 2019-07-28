import { LiveTree } from "./LiveTree";
describe("TreeHugger tests:", () => {
    beforeAll(() => { });

    var th = new LiveTree({ o1: { o11: { p1: "42" } } })
    //console.log("root:", JSON.stringify(th.root, null, 2));

    test("Dummy", () => {
        let req = {
            "*": "*",
            "**": {
                "*": "*",
                "**": {
                    "*": "*",
                    "**": {
                        "*": "*"
                    }
                }
            }
        };
        //console.log("req:", JSON.stringify(req, null, 4));
        var res1 = th.getSubTree(req);
        //console.log("Result:", JSON.stringify(res1, null, 4));

        expect(res1).toEqual(th.root);
    });
    test("subscriptionTree contains trees from subscriptions", () => {
        let sub1 = { o1: { "**": { "*": "*" } } }
        let sub2 = { o1: { o11: { p1: "*" } } }
        let expectation: subSchema = {
            o1: {
                __oSubs: [1, 2],
                o11: {
                    __oSubs: [2],
                    p1: {
                        _pSubs: [2]
                    }
                },
                "**": {
                    __oSubs: [1],
                    "*": {
                        _pSubs: [1]
                    }
                }
            }
        }
        interface subSchema {
            [pattern: string]: { __oSubs: number[] } | { [name: string]: subSchema }
        }
        var t: subSchema = { o1: { __oSubs: [], "**": { __oSubs: [] }, o11: {} } }
        th.subscribe(sub1, () => { }, 1)
        th.subscribe(sub2, () => { }, 2)
        expect(th.subscriptionTree).toEqual(expectation)
    })
    test("UpdateNotification", () => {
        // let updateTree = { devices: { HueGW: { Lamps: { Lamp1: { fadeTime: 100 } } } } }
        // let expectation = [
        //     {
        //         subID: "sub2",
        //         devices: {
        //             HueGW: {
        //                 Lamps: {
        //                     Lamp1: {
        //                         fadeTime: 100
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // ]

        // expect(th.getSubTree(updateTree)).toEqual(expectation)
    })
});
