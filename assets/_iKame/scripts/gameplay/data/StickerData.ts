import { IHoldableObject } from "../holdableObject/IHoldableObject";
import { ISticker } from "../stickers/ISticker";


export class StickerData
{
    readonly id : number;
    
    private readonly holdingObjects: Set<IHoldableObject> = new Set<IHoldableObject>();
    private readonly blockingStickers: Set<ISticker> = new Set<ISticker>();

    private readonly weightLockStickers: Set<ISticker> = new Set<ISticker>();
    private readonly weightLockObjects: Set<IHoldableObject> = new Set<IHoldableObject>();

    constructor(id : number, holdingObjects: IHoldableObject[], blockingStickers: ISticker[], weightLockStickers: ISticker[], weightLockObjects: IHoldableObject[]) {
        this.id = id;
        holdingObjects.forEach((obj: IHoldableObject) => {
            this.holdingObjects.add(obj);
        });

        blockingStickers.forEach((sticker: ISticker) => {
            this.blockingStickers.add(sticker);
        });

        weightLockStickers.forEach((sticker: ISticker) => {
            this.weightLockStickers.add(sticker);
        });

        weightLockObjects.forEach((obj: IHoldableObject) => {
            this.weightLockObjects.add(obj);
        });
    }
    
    public removeHoldingObject(holdableObject: IHoldableObject): void {
        this.holdingObjects.delete(holdableObject);
    }

    public removeBlockingSticker(sticker: ISticker): void {
        this.blockingStickers.delete(sticker);
    }

    public removeWeightLockSticker(sticker: ISticker): void {
        this.weightLockStickers.delete(sticker);
    }

    public removeWeightLockObject(holdableObject: IHoldableObject): void {
        this.weightLockObjects.delete(holdableObject);
    }

    public getHoldingObjectCount(): number {
        return this.holdingObjects.size;
    }

    public getBlockingStickerCount(): number {
        return this.blockingStickers.size;
    }

    public getWeightLockStickerCount(): number {
        return this.weightLockStickers.size;
    }

    public getWeightLockObjectCount(): number {
        return this.weightLockObjects.size;
    }
}


