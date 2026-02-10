export interface ISticker {
    peelOff(): Promise<void>;
    getName(): string;
    getNodeUID(): string;
    
    addListenerOnRemoved(listener: (sticker: ISticker) => void): void;
    removeListenerOnRemoved(listener: (sticker: ISticker) => void): void;

    destroySticker(): void;

    getBlockingPoint(): number;
    getStickerID(): number;
}


