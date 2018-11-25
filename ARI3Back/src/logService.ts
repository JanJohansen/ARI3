import { Observable, Subject } from "rxjs"
//import { merge } from "rxjs/operators";

interface ILogEvent {
    msg: any
    lvl: "usr" | "dev" | "dbg" | "tmp"
    src?: NamedLogger
    ts?: number
}

export class Logger {
    name: string
    mainLogr: Subject<any>
    constructor() {
        this.mainLogr = new Subject()
        // Set up default console listener...
        this.mainLogr.subscribe(newLogger => {
            newLogger.subscribe((evt: ILogEvent) => {
                console.log(`${new Date(evt.ts!).toISOString()}\t${evt.lvl}\t${evt.src!.name}\t ${JSON.stringify(evt.msg)}`)
            })
        })
    }
    createNamedLogger(name: string) {
        let childObs = new Observable()
        let logger = new NamedLogger(name, this)
        return logger
    }
}
export class NamedLogger {
    name: string
    parentLogger: Logger
    logr: Subject<any>
    constructor(name: string, parent: Logger) {
        this.name = name
        this.parentLogger = parent
        this.logr = new Subject()
        parent.mainLogr.next(this.logr)
    }
    user(...msg: any){
        this._log({ lvl: "usr", msg: msg })
    }
    developer(...msg: any){
        this._log({ lvl: "dev", msg: msg })
    }
    debug(...msg: any){
        this._log({ lvl: "dbg", msg: msg })
    }
    tmp(...msg: any){
        this._log({ lvl: "tmp", msg: msg })
    }
    private _log(evt: ILogEvent) {
        evt.ts = Date.now()
        evt.src = this
        this.logr.next(evt)
    }
}
