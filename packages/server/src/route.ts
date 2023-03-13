import { IncomingMessage, ServerResponse } from "node:http";

export type RouteMethod = Array<(req: IncomingMessage, res: ServerResponse, next: () => void) => any>

export class Route {
    [key: string]: RouteMethod;
}