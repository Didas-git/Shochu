import { inspect } from "node:util";
import { shochu } from "./shochu";

const s = shochu.new();

s.use(() => { })

s.get("/", () => { })
s.get("/*name", () => { });
s.get("/:age", () => { });

console.log(inspect(s.routes, false, null, true))