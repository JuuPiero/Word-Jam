import { ISticker } from "../stickers/ISticker";

export interface IHoldableObject {
    addSticker(sticker: ISticker): void;
    removeSticker(sticker: ISticker): void;
    freeObject(): void;
    getNodeUID(): string;
    getName(): string;

    addListenerOnRemoved(listener: (sticker: IHoldableObject) => void): void;
    removeListenerOnRemoved(listener: (sticker: IHoldableObject) => void): void;
}


