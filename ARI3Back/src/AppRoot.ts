import { Observable, Subject } from "rxjs"
import { mergeAll } from "rxjs/operators"
import {Logger} from "./logService"


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
}

export const appRoot = AppRoot.getInstance()