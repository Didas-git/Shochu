import EventEmitter from "node:events";
import { Method, RouteMethod } from "./engine";
import { Awaitable } from "./typings/awaitable";

export interface Emitter<T extends Record<string, Array<unknown>>> {
    on: (<K extends keyof T>(event: K, listener: (...args: T[K]) => Awaitable<any>) => this) & (<S extends string | symbol>(
        event: Exclude<S, keyof T>,
        listener: (...args: Array<unknown>) => Awaitable<any>,
    ) => this);

    emit: (<K extends keyof T>(event: K, ...args: T[K]) => boolean) & (<S extends string | symbol>(event: Exclude<S, keyof T>, ...args: Array<unknown>) => boolean);
}

export type GlobalEmitter = {
    data: [route: string, method: Method, handler: RouteMethod]
}

export const GlobalEmitter = <Emitter<GlobalEmitter>>new EventEmitter();