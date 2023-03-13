import { ServerResponse, IncomingMessage } from "node:http"
import { Route, RouteMethod } from "./route"

export const METHODS = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    DELETE: "OPTIONS",
    OPTIONS: "OPTIONS"
}

export type Methods = keyof typeof METHODS;

export class Router {

    #exactRoutes = new Map<string, Route>();
    #paramRoutes: Array<[RegExp, Route]> = [];
    #middleWare: RouteMethod = [];

    public handle(req: IncomingMessage, res: ServerResponse) {
        if (req.url === "/favicon.ico") return res.end();

        let route = this.#exactRoutes.get(req.url ?? "/");

        if (!route) {
            const paramRoute = this.#paramRoutes.find((val) => val[0].test(req.url ?? "/"));
            if (!paramRoute) return res.end();
            [, route] = paramRoute;

            return this.#handleRoute(req, res, route);
        }

        return this.#handleRoute(req, res, route);
    }

    #handleRoute(req: IncomingMessage, res: ServerResponse, route: Route): void {
        let idx = 0;
        const method = route[req.method as Methods ?? "GET"];
        method[idx](req, res, next);

        function next() {
            idx++;
            method[idx](req, res, next);
        }
    }

    public addMiddleWare(...functions: RouteMethod) {
        this.#middleWare.push(...functions);
    }

    public all(method: Methods | "ALL", path: string, ...routeMethods: RouteMethod) {
        const route = new Route();
        if (method === "ALL") {
            Object.keys(METHODS).forEach((m) => route[m] = [...this.#middleWare, ...routeMethods]);
        } else {
            route[method] = [...this.#middleWare, ...routeMethods];
        }

        if (path.includes("*") || path.includes(":")) {
            //param routes
            return;
        }

        this.#exactRoutes.set(path, route);
    }
}