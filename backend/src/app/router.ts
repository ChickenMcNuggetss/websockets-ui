import { Controller } from "./controller/controller.ts";
import { RequestIncoming } from "./model/request.ts";

export class Router {
  private controller = new Controller();

  defineRoute(dataRequest: RequestIncoming<any>) {
    console.log(dataRequest, 'dataRequest');
    if (!dataRequest.type || !this.controller.controller[dataRequest.type]) {
      return 'Not Found';
    }
    return this.controller.controller[dataRequest.type](dataRequest);
  }
}