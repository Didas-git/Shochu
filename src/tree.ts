import { TrieNode, TrieParamNode } from "./node.js";
import type { BuildContext } from "./radix.js";

function calculatePathLength(num: string, value: number): string {
    if (value === 0) return num;
    const slices = num.split("+");
    const init = Number(slices[0]);
    let total = Number(slices[1]);

    if (Number.isNaN(total)) total = 0;

    return Number.isNaN(init) ? `${slices[0]}+${value + total}` : (init + value).toString();
}

function createTopLevelIf(
    ctx: BuildContext,
    node: TrieNode,
    previousPathLength: string
): string {
    const result: Array<string> = [];

    for (let i = 1; i < node.part.length; ++i) {
        result.push(`if(${ctx.urlName}.charCodeAt(${previousPathLength})===${node.part.charCodeAt(i)})`);
        previousPathLength = calculatePathLength(previousPathLength, 1);
    }

    return result.join("");
}

function createMethodCheck(
    ctx: BuildContext,
    res: string | null,
    handler: (() => any) | null,
    preReturn: string | null
): string {
    return `${(res === null ? "" : `if(${res})`) + (preReturn === null ? "" : `{${preReturn}`)
    }return ${insertStore(ctx, handler)}${
        preReturn === null ? "" : "}"};`;
}

function insertStore(ctx: BuildContext, value: (() => any) | null): string {
    const key = `_f${ctx.currentID}`;
    ++ctx.currentID;
    ctx.paramsMap[key] = value;

    return key;
}

function parsePath(path: string): { path: Array<string>, params: Array<string> } {
    const firstParam = path.indexOf(":");
    if (firstParam === -1) return { path: [path], params: [] };
    const actualPath = [path.substring(0, firstParam - 1)];

    const params = path.substring(firstParam).split("/");
    const separatedParams: Array<string> = [];

    for (let i = 0, { length } = params; i < length; i++) {
        const chunk = params[i];

        // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
        if (chunk[0] === ":") {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const apc = actualPath.at(-1)!;
            // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
            if (apc[apc.length - 1] === "/") actualPath.push("/");
            else actualPath[actualPath.length - 1] = `${apc}/`;

            separatedParams.push(chunk.substring(1));
        } else actualPath.push(`/${chunk}`);
    }

    return {
        path: actualPath,
        params: separatedParams
    };
}

export class Tree {
    readonly #root = new TrieNode("/");

    public store(path: string, executer: () => any): any {
        if (path === "") path = "/";
        else if (!path.startsWith("/")) path = `/${path}`;

        const isWildcard = path.endsWith("*");
        if (isWildcard) path = path.slice(0, -1);

        const { path: inertParts, params: paramParts } = parsePath(path);

        let node = this.#root;
        let paramPartsIndex = 0;

        for (let i = 0, { length } = inertParts; i < length; ++i) {
            let part = inertParts[i];

            if (i > 0) {
                const param = paramParts[paramPartsIndex++];
                if (node.params === null) node.params = new TrieParamNode(param);
                else if (node.params.paramName !== param)
                    throw new Error(`Cannot create route "${path}" with parameter "${param}" because a route already exists with a different parameter name ("${node.params.paramName}") in the same location`);

                if (node.params.inert === null) {
                    node = node.params.inert = new TrieNode(part);
                    continue;
                }

                node = node.params.inert;
            }

            for (let j = 0; ;) {
                if (j === part.length) {
                    if (j < node.part.length) {
                        const childNode = Object.assign(Object.create(Object.getPrototypeOf(node) as typeof TrieNode), node) as TrieNode;
                        childNode.part = node.part.slice(j);

                        const newNode = new TrieNode(part);
                        newNode.inert = [childNode];
                        Object.assign(node, newNode);
                    }
                    break;
                }

                if (j === node.part.length) {
                    if (node.inert === null) node.inert = [];
                    else {
                        const inertNode = node.inert.get(part.charCodeAt(j));
                        if (typeof inertNode !== "undefined") {
                            node = inertNode;
                            part = part.slice(j);
                            j = 0;
                            continue;
                        }
                    }

                    const childNode = new TrieNode(part.slice(j));
                    node.inert?.set(part.charCodeAt(j), childNode);
                    node = childNode;

                    break;
                }

                if (part[j] !== node.part[j]) {
                    const existingChild = Object.assign(Object.create(Object.getPrototypeOf(node) as typeof TrieNode), node) as TrieNode;
                    existingChild.part = node.part.slice(j);
                    const newChild = new TrieNode(part.slice(j));

                    const newNode = new TrieNode(node.part.slice(0, j));
                    newNode.inert = [
                        existingChild,
                        newChild
                    ];
                    Object.assign(node, newNode);

                    node = newChild;
                    break;
                }

                ++j;
            }
        }

        if (paramPartsIndex < paramParts.length) {
            const param = paramParts[paramPartsIndex];

            if (node.params === null) node.params = new TrieParamNode(param);
            else if (node.params.paramName !== param)
                throw new Error(`Cannot create route "${path}" with parameter "${param}" because a route already exists with a different parameter name ("${node.params.paramName}") in the same location`);

            if (node.params.store === null) node.params.store = executer;
            return node.params.store;
        }

        if (isWildcard) {
            if (node.wildcardStore === null) node.wildcardStore = executer;
            return node.wildcardStore;
        }

        if (node.store === null) node.store = executer;
        return node.store;
    }

    public compile(
        // eslint-disable-next-line @typescript-eslint/default-param-last
        node: TrieNode = this.#root,
        ctx: BuildContext,
        previousPathLength: string,
        isChildParam: boolean = false,
        isNestedChildParam: boolean = false
    ): Array<string> {
        const builder: Array<string> = [];
        const isRoot = node.part === "/" && node.part.length === 1;
        const pathLength = calculatePathLength(previousPathLength, node.part.length - 1);

        if (!isRoot) builder.push(createTopLevelIf(ctx, node, previousPathLength), "{");

        if (node.store !== null) {
            builder.push(createMethodCheck(
                ctx,
                `${ctx.pathEndName}===${pathLength}`,
                node.store,
                null
            ));
        }

        if (node.inert !== null) {
            const keys = node.inert.keys();
            let it = keys.next();

            if (node.inert.size === 1) {
                builder.push(`if(${ctx.urlName}.charCodeAt(${pathLength})===${it.value})`);
                builder.push(...this.compile(node.inert.get(it.value as number), ctx, calculatePathLength(pathLength, 1), isChildParam, isNestedChildParam));
            } else {
                builder.push(`switch(${ctx.urlName}.charCodeAt(${pathLength})){`);

                do {
                    builder.push(`case ${it.value}:{`);
                    builder.push(...this.compile(node.inert.get(it.value as number), ctx, calculatePathLength(pathLength, 1), isChildParam, isNestedChildParam));
                    builder.push("break;}");

                    it = keys.next();
                } while (!it.done);

                builder.push("}");
            }
        }

        if (node.params !== null) {
            const prevIndex = isChildParam ? "_p" : pathLength;

            if (isChildParam) {
                if (!isNestedChildParam) builder.push("let ");
                builder.push(`_p=${pathLength};`);
            }

            const nextSlashIndex = `${ctx.urlName}.indexOf('/',${prevIndex})`;
            const hasInert = node.params.inert !== null;
            const hasStore = node.params.store !== null;
            const key = node.params.paramName;

            if (hasInert) {
                if (!isChildParam) builder.push("let ");
                builder.push(`_c=${nextSlashIndex};`);
            }

            if (hasStore) {
                const value = `${ctx.urlName}.substring(${prevIndex}${
                    ctx.hasPath ? "" : `,${ctx.pathEndName}`
                })`;

                builder.push(createMethodCheck(
                    ctx,
                    `${hasInert ? "_c" : nextSlashIndex}===-1`,
                    node.params.store,
                    `${ctx.paramsName}${isChildParam
                        ? `.${key}=${value}`
                        : `={${key}:${value}}`
                    };`
                ));
            }

            if (hasInert) {
                const value = `${ctx.urlName}.substring(${prevIndex},_c)`;

                builder.push(hasStore ? "" : `if(_c===-1)return ${ctx.fallback};`);
                builder.push(ctx.paramsName);
                builder.push(isChildParam
                    ? `.${key}=${value};`
                    : `={${key}:${value}};`);

                builder.push(...this.compile(
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    node.params.inert!,
                    ctx,
                    calculatePathLength("_c", 1),
                    true,
                    isChildParam
                ));
            }
        }

        if (node.wildcardStore !== null) {
            const value = `${ctx.urlName}.substring(${pathLength})`;

            // Wildcard parameter
            builder.push(ctx.paramsName);
            builder.push(isChildParam ? `['*']=${value};` : `={'*':${value}};`);
            builder.push(createMethodCheck(ctx, null, node.wildcardStore, null));
        }

        if (!isRoot) builder.push("}");

        return builder;
    }
}
