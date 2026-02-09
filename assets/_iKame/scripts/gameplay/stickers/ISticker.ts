import { HoldableObject } from "../holdableObject/HoldableObject";

export interface ISticker {
    peelOff(): Promise<void>;
    getName(): string;
    getNodeUID(): string;
    
    addListenerOnRemoved(listener: (sticker: ISticker) => void): void;
    removeListenerOnRemoved(listener: (sticker: ISticker) => void): void;
}


