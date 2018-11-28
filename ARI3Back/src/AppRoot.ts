import {Logger} from "./common/logService"

class AppRoot {
  // Singleton instance handling
  private static instance: AppRoot
  static getInstance() {
    if (!AppRoot.instance) AppRoot.instance = new AppRoot()
    return AppRoot.instance
  }

  // Variable declarations
  logger: Logger

  // Methods
  constructor() {
    this.logger = new Logger()
  }

  // TS: Allow any members to be added.
  [name: string]: any
}

export const appRoot = AppRoot.getInstance()