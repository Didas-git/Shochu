import { Engine } from "./engine";

class Shochu {
    //@ts-expect-error
    public default(): Engine { }
    public new(): Engine {
        return new Engine()
    }
}

export const shochu = new Shochu();