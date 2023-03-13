import { createServer as createHTTP, METHODS } from "node:http";
import { createServer as createHTTPS } from "node:https";
import { RouteMethod } from "./route";

import { Router } from "./router";

export interface ShochuOptions {
    ssl?: {
        key: string | Buffer | Array<string | Buffer>,
        cert: string | Buffer | Array<string | Buffer>
    }
}

export class Shochu {

    #ssl: ShochuOptions["ssl"]
    #router = new Router();

    public constructor(options: ShochuOptions = {}) {
        this.#ssl = options.ssl;
        METHODS.forEach((method) => {
            method = method.toLowerCase();
        })
    }

    public listen(port: string | number = 8080, callback?: () => any): this {
        this.#ssl ? createHTTPS(this.#ssl, this.#router.handle).listen(port) : createHTTP((req, res) => this.#router.handle(req, res)).listen(port);
        callback && callback();
        return this;
    }

    public use(...middleWare: RouteMethod): this {
        this.#router.addMiddleWare(...middleWare);
        return this;
    }

    // public group()

    public get(path: string, ...callbacks: RouteMethod): this {
        this.#router.all("GET", path, ...callbacks);
        return this;
    }
}