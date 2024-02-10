import { Radix, createContext } from "./radix.js";

export class Shochu {
    readonly #tries = new Map<string, Radix>();
    readonly #static = new Map<string, Array<[string, () => any]>>();
    readonly #matchers: Record<string, [Record<string, unknown>, () => any]> = {};
    #finder!: (req: Request) => (((...args: Array<any>) => any) | null);

    #any(method: string, path: string, executer: () => any): this {
        if (path.includes("*") || path.includes(":")) {
            const radix = this.#tries.get(method);
            if (typeof radix === "undefined") this.#tries.set(method, new Radix().add(path, executer));
            else radix.add(path, executer);
        } else {
            const route = this.#static.get(method);
            if (!path.startsWith("/")) path = `/${path}`;
            if (typeof route === "undefined") this.#static.set(method, [[path, executer]]);
            else route.push([path, executer]);
        }

        return this;
    }

    public get(path: string, executer: () => any): this {
        return this.#any("GET", path, executer);
    }

    public listen(port: number): void {
        this.#compile();
        Bun.serve({
            port,
            fetch: async (request) => {
                return this.handle(request);
            }
        });
    }

    public async handle(request: Request): Promise<any> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/return-await
        return await this.#finder(request)?.(request);
    }

    #compile(): this {
        for (const [method, path] of this.#static) {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            if (!(method in this.#matchers)) this.#matchers[method] = [ {}, (() => {})];
            const matcherMethod = this.#matchers[method];

            for (let i = 0, { length } = path; i < length; i++) {
                const route = path[i];
                // eslint-disable-next-line @typescript-eslint/prefer-destructuring
                matcherMethod[0][route[0].substring(1)] = route[1];
            }
        }

        for (const [method, radix] of this.#tries) {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            if (!(method in this.#matchers)) this.#matchers[method] = [ {}, (() => {})];
            const matcherMethod = this.#matchers[method];
            matcherMethod[1] = radix.build();
        }

        this.#buildFinder();

        return this;
    }

    #buildFinder(): void {
        const { value, path } = this.#buildPathParser();
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-assignment
        this.#finder = new Function("matchers", `return (c)=>{
const matcher = matchers[c.method];
if (typeof matcher === "undefined") return;
${value} return matcher[0][${path}] ?? matcher[1](c)
}`)(this.#matchers);
    }

    #buildPathParser(): { value: string, path: string } {
        const ctx = createContext({ matchPath: false });

        return {
            value: `${ctx.pathStartName}=${ctx.urlName}.indexOf('/', 12)+1;
${ctx.pathEndName}=${ctx.urlName}.indexOf('?',${ctx.pathStartName});
${ctx.contextName}.path=${ctx.pathEndName}===-1?${ctx.urlName}.substring(${ctx.pathStartName}):${ctx.urlName}.substring(${ctx.pathStartName},${ctx.pathEndName});`,
            path: `${ctx.contextName}.path`
        };
    }
}

// //@ts-expect-error No types yet
// s.get("a/c/:x", (ctx) => {
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
//     return Response.json(ctx.params);
// });

// //@ts-expect-error No types yet
// s.get("b/:s", (ctx) => {
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
//     return Response.json(ctx.params);
// });
const s = new Shochu();

//@ts-expect-error No types yet
s.get("x/:id", (ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return Response.json(ctx.params);
});

s.listen(8080);
