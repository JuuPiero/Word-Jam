import { HoldableObject } from "../holdableObject/HoldableObject";

export interface ISticker {
    peelOff(): void;
    getName(): string;
    getNodeUID(): string;
}


