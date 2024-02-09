export interface ParamNode {
    paramName: string;
    store: unknown;
    inert: TrieNode | null;
}

export class TrieNode {
    public part: string;
    public store: (() => any) | null = null;
    public params: TrieParamNode | null = null;
    public wildcardStore: (() => any) | null = null;
    #inert: Map<number, TrieNode> | null = null;

    public constructor(part: string) {
        this.part = part;
    }

    public get inert(): Map<number, TrieNode> | null {
        return this.#inert;
    }

    public set inert(nodes: Array<TrieNode>) {
        this.#inert = new Map(nodes.map((child) => [child.part.charCodeAt(0), child]));
    }
}

export class TrieParamNode {
    public paramName: string;
    public store: (() => any) | null = null;
    public inert: TrieNode | null = null;

    public constructor(paramName: string) {
        this.paramName = paramName;
    }
}
