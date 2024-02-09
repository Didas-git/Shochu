import { Tree } from "./tree.js";

export class Radix {
    public readonly tree: Tree;

    public constructor() {
        this.tree = new Tree();
    }

    public add(path: string, executer: () => any): this {
        this.tree.store(path, executer);
        return this;
    }

    public build(): (() => any) {
        return this.#compile();
    }

    #compile(): (() => any) {
        const ctx = createContext();
        const content = this.tree.compile(undefined, ctx, ctx.pathStartName);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-implied-eval
        return new Function(
            ...Object.keys(ctx.paramsMap),
            `return (${ctx.contextName})=>{${content.join("")}return ${ctx.fallback}}`
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        )(...Object.values(ctx.paramsMap));
    }
}

export interface Options<T = any> {
    contextName?: string;
    /**
     * Whether to match using c.path or c.url
     */
    matchPath?: boolean;
    /**
     * Index of
     */
    minURLLen?: number;
    directCall?: boolean;
    fallback?: T | null;
    /**
     * Start index for URL matching
     */
    pathStart?: number;
    /**
     * Set this to false to remove path parsing even when path is not provided (use c.url)
     */
    parsePath?: boolean;
}

export interface BuildContext {
    /**
     * All store map
     */
    readonly paramsMap: Record<string, any>;

    /**
     * Variable name of the context object
     */
    readonly contextName: string;

    /**
     * The name of the path end variable
     */
    readonly pathEndName: string;

    /**
     * The name of the path start variable
     */
    readonly pathStartName: string;

    /**
     * The name of the params variable
     */
    readonly paramsName: string;

    /**
     * The name of the url variable
     */
    readonly urlName: string;

    /**
     * If the path name is already parsed
     */
    readonly hasPath: boolean;

    /**
     * Call arguments
     */
    readonly caller: string;

    /**
     * Fallback variable or null
     */
    readonly fallback: string;

    /**
     * The current ID of the store
     */
    currentID: number;
}

export function createContext(options: Options = {}): BuildContext {
    // Fix missing options
    options.contextName ??= "c";
    options.matchPath ??= true;
    options.minURLLen ??= 12;
    options.directCall ??= false;

    const caller = options.directCall ? `(${options.contextName})` : "";

    return {
        pathStartName: options.pathStart?.toString() ?? (options.matchPath ? "0" : `${options.contextName}._pathStart`),
        pathEndName: `${options.contextName}.${options.matchPath ? "path.length" : "_pathEnd"}`,

        urlName: `${options.contextName}.${options.matchPath ? "path" : "url"}`,
        paramsName: `${options.contextName}.params`,

        currentID: 0,
        paramsMap: {},

        caller,

        contextName: options.contextName,

        fallback: options.fallback ? `_d${caller}` : "null",

        hasPath: options.matchPath
    };
}
