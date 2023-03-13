import { METHODS, RouteMethod } from "./engine";
import { GlobalEmitter } from "./global-emitter";

export class RouterGroup {
    #basePath: string;

    constructor(basePath: string = "") {
        this.#basePath = basePath;
    }

    public any() { }
    public get(path: string, handler: RouteMethod) {
        path = this.#basePath + path;
        GlobalEmitter.emit("data", path, METHODS.GET, handler)
    }
    public post() { }
    public put() { }
    public delete() { }
    public head() { }
    public options() { }
    public patch() { }
}