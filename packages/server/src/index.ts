import { Shochu } from "./shochu";

const app = new Shochu();

app.use((_, __, next) => {
    console.log("1");
    next();
}, (_, __, next) => {
    console.log("2");
    next();
},)

app.get("/", (_, res) => {
    res.end("IT WORKS");
})

app.get("/user", (_, res) => {
    res.end("USERSSSS");
})

app.listen();