import { ISticker } from "../stickers/ISticker";

export class HodlablleData {
    private _stickers : Set<ISticker> = new Set<ISticker>();

    constructor(stickers: ISticker[]) {
        stickers.forEach((sticker: ISticker) => {
            this._stickers.add(sticker);
        });
    }

    public removeSticker(sticker: ISticker): void {
        this._stickers.delete(sticker);
    }

    public addSticker(sticker: ISticker): void {
        this._stickers.add(sticker);
    }

    public getStickerCount(): number {
        return this._stickers.size;
    }
}


