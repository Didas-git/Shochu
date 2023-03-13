import { IncomingMessage, ServerResponse } from "node:http";
import { GlobalEmitter } from "./global-emitter";
import { RouterGroup } from "./router-group";

export type RouteMethod = (req: IncomingMessage, res: ServerResponse, next: () => void) => any

export const WildCardMethod = {
    PARTIAL: "PARTIAL",
    ANY: "ANY"
}

export type WildCardMethod = keyof typeof WildCardMethod | typeof WildCardMethod[keyof typeof WildCardMethod];

export const METHODS = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    DELETE: "OPTIONS",
    OPTIONS: "OPTIONS"
}

export type Method = keyof typeof METHODS | typeof METHODS[keyof typeof METHODS] | "ALL";

export interface WildCard {
    uri: string;
    method: WildCardMethod;
}

export type RoutesMap = Map<string, {
    method: Method;
    wildcards: Array<WildCard> | undefined;
    handlers: Array<RouteMethod>
}>

export class Engine extends RouterGroup {
    #routes: RoutesMap = new Map();
    #middleWare: Array<RouteMethod> = [];

    constructor() {
        super();

        GlobalEmitter.on("data", (route, method, handler) => {
            this.#routes.set(route, {
                method: method,
                wildcards: this.#isWildCard(route) ? [{ uri: route, method: this.#wildCardMethod(route) }] : void 0,
                handlers: [...this.#middleWare, handler]
            })
        })
    }

    public run() { }
    public use(handler: RouteMethod) {
        this.#middleWare.push(handler);
        return this;
    }
    public group(path: string): RouterGroup
    public group(path: string, callback: (router: RouterGroup) => any): void
    public group(path: string, callback?: (router: RouterGroup) => any): RouterGroup | void {
        if (typeof callback === "function") {
            return callback(new RouterGroup(path));
        }

        return new RouterGroup(path);
    }

    public get routes() {
        return this.#routes;
    }

    #isWildCard(route: string): boolean {
        return route.includes("*") || route.includes(":")
    }

    #wildCardMethod(route: string): WildCardMethod {
        //!this is not the final version, its just a test case
        if (route.includes("*")) return WildCardMethod.ANY;
        return WildCardMethod.PARTIAL;

    }
}