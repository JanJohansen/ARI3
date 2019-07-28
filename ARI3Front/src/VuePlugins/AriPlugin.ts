import { AriWsClient } from ".././services/AriWsClient"

let plugin = {
    install(vue: any, opts: any) {
        console.log('Installing Ari plugin!')

        var ari = new AriWsClient("connection", { ins: { reconnectInterval: opts.reconnectInterval } })
        vue.prototype.$ari = ari
        // vue.prototype.$ariTree.log = (...args) => { console.log(...args) }
    }
}
export default plugin