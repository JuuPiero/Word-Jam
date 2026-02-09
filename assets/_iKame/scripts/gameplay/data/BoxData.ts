export class BoxData {
    static readonly MAX_STICKER_COUNT: number = 3;
    private _stickerID: number
    private _filledStickerCount: number = 0;

    public get stickerID(): number {
        return this._stickerID;
    }

    public get filledStickerCount(): number {
        return this._filledStickerCount;
    }

    constructor(stickerID: number) {
        this._stickerID = stickerID;
    }

    public addFilledStickerCount(count: number): void {
        this._filledStickerCount += count;
    }

    public reset(id : number): void 
    {
        this._stickerID = id;
        this._filledStickerCount = 0;
    }

    public isFull(): boolean {
        return this._filledStickerCount >= BoxData.MAX_STICKER_COUNT;
    }
}


