import { Logger } from "./common/logService"
import { AriNodeBase } from "./common/AriNodeBase"

class AppRoot {
  // Singleton instance handling
  private static instance: AppRoot
  static getInstance() {
    if (!AppRoot.instance) AppRoot.instance = new AppRoot()
    return AppRoot.instance
  }

  // Variable declarations
  logger: Logger
  ariRoot: AriNodeBase
  
  // Methods
  constructor() {
    this.logger = new Logger()
    this.ariRoot = new AriNodeBase(null, "Ari")
    this.ariRoot.addChild(new AriNodeBase(null, "graphRoot"))
  }

  // TS: Allow any members to be added.
  [name: string]: any
}

export const appRoot = AppRoot.getInstance()