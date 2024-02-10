class RadixNode {
    public prefix: string;
    public isLeaf: boolean;
    public readonly nodes: Record<string, RadixNode> = {};

    public constructor(prefix: string, isLeaf: boolean = false) {
        this.prefix = prefix;
        this.isLeaf = isLeaf;
    }

    public match(word: string): [string, string, string] {
        let i = 0;

        for (;;i++) if (this.prefix[i] !== word[i]) break;

        return [this.prefix.substring(0, i), this.prefix.substring(i), word.substring(i)];
    }

    public insert(word: string): void {
        if (this.prefix === word && !this.isLeaf) this.isLeaf = true;
        else if (!(word[0] in this.nodes)) this.nodes[word[0]] = new RadixNode(word, true);
        else {
            const node = this.nodes[word[0]];
            const [matching, remainingPrefix, remainingWord] = node.match(word);

            if (remainingPrefix === "") this.nodes[matching[0]].insert(remainingWord);
            else {
                node.prefix = remainingPrefix;
                const auxNode = this.nodes[matching[0]];
                this.nodes[matching[0]] = new RadixNode(matching);
                this.nodes[matching[0]].nodes[remainingPrefix[0]] = auxNode;

                if (remainingWord === "") this.nodes[matching[0]].isLeaf = true;
                else this.nodes[matching[0]].insert(remainingWord);
            }
        }
    }

    public find(word: string): boolean {
        const node = this.nodes[word[0]];
        if (typeof node === "undefined") return false;

        // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
        const [_, remainingPrefix, remainingWord] = node.match(word);
        if (remainingPrefix === "") return false;
        else if (remainingWord === "") return node.isLeaf;
        return node.find(remainingWord);
    }

    public print(height: number = 0): void {
        if (this.prefix !== "") console.log(`${"-".repeat(height)}${this.prefix}  ${this.isLeaf ? "(leaf)" : ""}`);
        for (const node in this.nodes) this.nodes[node].print(height + 1);
    }
}

const x = new RadixNode("/");
x.insert("x/:id");
x.insert("x/s/:id");
x.insert("xp/:id");
x.insert("xp/:id/x");

x.print();
