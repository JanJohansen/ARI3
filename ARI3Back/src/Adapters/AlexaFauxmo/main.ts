//import {FauxMo} from "node-fauxmo"
const FauxMo = require('node-fauxmo');

export class AlexaFauxMo {
    fauxMo: any
    dev4status = 0;
    constructor() {
        this.fauxMo = new FauxMo(
            {
                devices: [{
                    name: 'Fake Device 10',
                    port: 11000,
                    handler: function (action) {
                        console.log('Fake Device 1:', action);
                    }
                },
                {
                    name: 'Fake Device 2',
                    port: 11001,
                    handler: function (action) {
                        console.log('Fake Device 2:', action);
                    }
                },
                {
                    name: 'Fake Device 3',
                    port: 11002,
                    handler: function (action) {
                        console.log('Fake Device 3:', action);
                    }
                },
                {
                    name: 'Fake Device 4',
                    port: 11003,
                    handler: function (action) {
                        console.log('Fake Device 4:', action);
                        this.dev4handler(action);
                    },
                    statusHandler: function (callback) {
                        callback(this.dev4statushandler());
                    }
                }
                ]
            });
    }
    dev4statushandler() {
        return this.dev4status;
    }

    dev4handler(action) {
        this.dev4status = action;
    }
}