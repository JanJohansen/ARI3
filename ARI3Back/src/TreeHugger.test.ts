import { TreeHugger } from "./TreeHugger";
describe("TreeHugger tests:", () => {
    beforeAll(() => { });

    var th = new TreeHugger({ devices: { HueGW: { Lamps: { Lamp1: { brightness: "42" } } } } })
    console.log("root:", JSON.stringify(th.root, null, 2));

    test("Dummy", () => {
        let req = {
            "*": "*",
            devices: {
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
            }
        };
        console.log("req:", JSON.stringify(req, null, 4));
        var res1 = th.getSubTree(req);
        console.log("Result:", JSON.stringify(res1, null, 4));

        expect(res1).toStrictEqual(th.root);
    });
    test("SubscriptionTree", () => {
        let sub1 = { devices: { HueGW: { Lamps: { "**": { "*": "*" } } } } }
        let sub2 = { devices: { HueGW: { Lamps: { Lamp1: { fadeTime: "*" } } } } }
        let expectation = {
            devices: {
                HueGW: {
                    Lamps: {
                        "**": [sub1],
                        Lamp1: {
                            "*": [sub1],
                            fadeTime: [sub2]
                        }
                    }
                }
            }
        }

        th.sub(sub1, "subId1")
        th.sub(sub2, "subId2")
        expect(th.subTree).toBe(expectation)
    })
    test("UpdateNotification", () => {
        let updateTree = { devices: { HueGW: { Lamps: { Lamp1: { fadeTime: 100 } } } } }
        let expectation = [
            {
                subID: "sub2",
                devices: {
                    HueGW: {
                        Lamps: {
                            Lamp1: {
                                fadeTime: 100
                            }
                        }
                    }
                }
            }
        ]

        expect(th.getSubTree(updateTree)).toBe(expectation)
    })
});
