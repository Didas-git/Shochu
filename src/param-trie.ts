class RadixNode {
    public prefix: string;
    public isLeaf: boolean;
    /* Means that `prefix` is the param name */
    public isParam: boolean;
    public callback: (() => any) | null;
    public readonly nodes: Record<string, RadixNode> = {};

    public constructor(
        prefix: string,
        executer: (() => any) | null = null,
        isLeaf: boolean = false,
        isParam: boolean = false
    ) {
        this.prefix = prefix;
        this.isLeaf = isLeaf;
        this.isParam = isParam;
        this.callback = executer;
    }

    public match(path: string): [string, string, string] {
        let i = 0;
        const smaller = this.prefix.length >= path.length ? path : this.prefix;
        for (let { length } = smaller; i < length; i++) if (this.prefix[i] !== path[i]) break;
        return [this.prefix.substring(0, i), this.prefix.substring(i), path.substring(i)];
    }

    public insert(path: string, executer: () => any, isParam: boolean = false): void {
        if (path.startsWith(":")) {
            path = path.substring(1);
            isParam = true;
        }
        if (isParam) {
            const splitAt = path.indexOf("/");
            if (splitAt === -1) {
                this.nodes[path[0]] = new RadixNode(path, executer, true, isParam);
                return;
            }

            const paramName = path.substring(0, splitAt);
            const restOfThePath = path.substring(splitAt + 1);
            const newNode = new RadixNode(paramName, null, true, isParam);

            if (restOfThePath !== "") newNode.insert(restOfThePath, executer);

            this.nodes[path[0]] = newNode;

            return;
        } else if (this.prefix === path && !this.isLeaf) {
            this.isLeaf = true;
            this.callback = executer;
            return;
        } else if (!(path[0] in this.nodes)) {
            const index = path.indexOf(":");
            if (index !== -1) {
                const pathSplit = path.substring(0, index);
                const newNode = new RadixNode(pathSplit, null, true, isParam);

                newNode.insert(path.substring(index + 1), executer, true);
                this.nodes[path[0]] = newNode;
                return;
            }

            this.nodes[path[0]] = new RadixNode(path, null, true, isParam);
            return;
        }

        const node = this.nodes[path[0]];
        const [matching, remainingPrefix, remainingPath] = node.match(path);

        if (remainingPrefix === "") this.nodes[matching[0]].insert(remainingPath, executer);
        else {
            node.prefix = remainingPrefix;
            const auxNode = this.nodes[matching[0]];
            this.nodes[matching[0]] = new RadixNode(matching);
            this.nodes[matching[0]].nodes[remainingPrefix[0]] = auxNode;

            if (remainingPath === "") this.nodes[matching[0]].isLeaf = true;
            else this.nodes[matching[0]].insert(remainingPath, executer);
        }
    }

    public find(word: string): RadixNode | null {
        const node = this.nodes[word[0]];
        if (typeof node === "undefined") return null;
        if (node.prefix === word) return node;

        // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
        const [_, remainingPrefix, remainingWord] = node.match(word);
        if (remainingPrefix === "") return null;
        else if (remainingWord === "") return node;
        return node.find(remainingWord);
    }

    public print(height: number = 0): void {
        if (this.prefix !== "") console.log(`${"-".repeat(height)}${this.prefix} ${this.isParam ? "(param)" : ""} ${this.isLeaf ? "(leaf)" : ""}`);
        for (const node in this.nodes) this.nodes[node].print(height + 1);
    }
}

const x = new RadixNode("/");
x.insert("x/:id", () => "{}");
x.insert("x/s/:id", () => "{}");
x.insert("xp/:id", () => "{}");
x.insert("xp/:id/x", () => "{}");
x.insert("and/:id/s", () => "{}");
x.insert("bru/s/:id", () => "{}");
x.insert("vpb/:x/:id", () => "{}");

x.print();

console.log(x.find("vpb"));

// console.log(JSON.stringify(x));
