import { appRoot } from "./AppRoot"
var log = appRoot.logger.createNamedLogger("MQTTTrap")

export class MQTTTrap {
    static ARIInfo = {
        description: "MQTT-Like server",
        outs: {
            topics: {description:"List of Topic/Value pairs present on server."},
        },
        ins: {
            topics: {description:"When sent an object containing topic and value members will send MQTT publish message tot his topic with the given value."},
        }
    }
    outs = {topics: {}}
    ins = {topics: {}}
    constructor() {
        log.developer("Creating MQTT Trap!")
        var net = require('net')
        var mqttCon = require('mqtt-connection')
        var server = new net.Server()
        var self = this

        server.on('connection', function (stream) {
            log.debug("MQTT client connected.")
            var client = mqttCon(stream)

            // client connected
            client.on('connect', function (packet) {
                log.debug("MQTT client connection request.")
                log.debug("ClientID:", packet.clientId, "UName:", packet.username, "PW:", packet.password)
                //log.debug("packet = ", packet)
                // acknowledge the connect packet
                client.connack({ returnCode: 0 });
            })
            // client published
            client.on('publish', function (packet) {
                log.debug("PUBLISH: packet = ", packet)
                log.debug(packet.topic, "=", packet.payload.toString())

                self.outs.topics[packet.topic] = packet.payload.toString()
                log.debug("outs.topics:", JSON.stringify(self.outs.topics, null, 2))

                // send a puback with messageId (for QoS > 0)
                if (packet.qos > 0) client.puback({ messageId: packet.messageId })
            })

            // client pinged
            client.on('pingreq', function () {
                log.debug("PINGREQ")
                // send a pingresp
                client.pingresp()
            });

            // client subscribed
            client.on('subscribe', function (packet) {
                log.debug("SUBSCRIBE: packet = ", packet)
                // send a suback with messageId and granted QoS level
                client.suback({ granted: [packet.qos], messageId: packet.messageId })
            })

            // timeout idle streams after 5 minutes
            stream.setTimeout(1000 * 60 * 5)

            // connection error handling
            client.on('close', function () {
                log.debug("CLOSE: client")
                client.destroy()
            })
            client.on('error', function (err) {
                log.debug("ERROR: client", err)
                client.destroy()
            })
            client.on('disconnect', function () {
                log.debug("DISCONNECT: client", client)
                client.destroy()
            })

            // stream timeout
            stream.on('timeout', function () {
                log.debug("TIMEOUT: client", client)
                client.destroy();
            })
        })

        // listen on port 1883
        server.listen(1883)
    }
}


//IDEA: UIDs for values...
var objects = {
    "AgsOAQEPDQUPBw8BBAoHAQ": {
        name: "Object X",
        ins: {},
        outs: {},
        calls: {},
        tags: {location:"kitchen", logAll:true,parent:"AgsOAQEPDQUPBw8BBAoHAW"},
        children: []
    }
}
// OII = Object Instance Id
sub("AgsOAQEPDQUPBw8BBAoHAQ:outs.out1.v", (v)=>{console.log(v)})

// Device local ID's
var clientObjects = {
    "Root": {
        parent:null,
        ins: {"i1":{name:"Input 1", type:"number", description:"..."}},
        outs: {"o1":{name:"output1", type:"number", description:"..."}},
        calls: {"c1":{name:"call1", description:"..."}},
        tags: {location:"kitchen", logAll:true},
        children: []
    },
    "Lamps": {
        parent:"Root",
        children: ["Needed???"]
    },
    "Lamp(1)": {
        parent:null,
        ins: {"brightness":{type:"number", description:"..."}},
        outs: {"brightness":{type:"number", description:"..."}},
        tags: {location:"kitchen"},
        children: []
    }
}
function getObjectInfos() {return clientObjects}
sub("Lamp(1):outs.brightness.v")
sub("Root.Lamps.Lamp(1):outs.brightness.v")

// UIDS for "members"
var members = {
    "fkjhgiueh43l4ht3h5thj": {
        parent:"OID:34kj5g34kj5",
        name:"brightness",

    }
}
