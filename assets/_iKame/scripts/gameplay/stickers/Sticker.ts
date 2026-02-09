import { _decorator, CCInteger, CCString, Component, Node } from 'cc';
import { ISticker } from './ISticker';
import { IHoldableObject } from '../holdableObject/IHoldableObject';
import { ILevelController } from '../../controllers/ILevelController';
import { StickerData } from '../data/StickerData';
const { ccclass, property } = _decorator;

@ccclass('Sticker')
export class Sticker extends Component implements ISticker
{
    @property({ type: [ CCString ], readonly: true })
    public blockingStickers : string[] = [];

    @property({ type: [ CCString ], readonly: true })
    public holdingObjects: string[] = [];
    
    @property({ type: [ CCString ], readonly: true })
    public weightLockStickers: string[] = [];

    @property({ type: [ CCString ], readonly: true })
    public weightLockObjects: string[] = [];

    @property({ type: CCInteger, readonly: true })
    public stickerID: number = 0;

    private _data: StickerData;
    private _levelController: ILevelController;

    private onStickerRemoved: ((sticker: ISticker) => void)[] = [];

    public setup(levelController: ILevelController,
        blockingStickers: ISticker[],
        holdingObjects: IHoldableObject[],
        weightLockStickers: ISticker[],
        weightLockObjects: IHoldableObject[]
    ): StickerData
    {
        this._levelController = levelController;
        this._data = new StickerData(
            this.stickerID,
            holdingObjects,
            blockingStickers,
            weightLockStickers,
            weightLockObjects
        );

        for (const sticker of blockingStickers)
        {
            sticker.addListenerOnRemoved(this.onBlockingStickerRemoved.bind(this));
        }

        for (const sticker of weightLockStickers)
        {
            sticker.addListenerOnRemoved(this.onWeightLockStickerRemoved.bind(this));
        }

        for (const holdableObject of weightLockObjects)
        {
            holdableObject.addListenerOnRemoved(this.onWeightLockObjectRemoved.bind(this));
        }

        return this._data;
    }

    public tryPeelOff(): void
    {
        if (this._data.getWeightLockObjectCount() > 0 || this._data.getWeightLockStickerCount() > 0 || this._data.getBlockingStickerCount() > 0)
        {
            return;
        }
        this.peelOff();
    }

    peelOff(): void
    {
        for (const holdableObject of this._data.HoldingObjects)
        {
            holdableObject.removeSticker(this);
        }
        this._data.clearHoldingObjects();
        for (const listener of this.onStickerRemoved) {
            listener(this);
        }
        this.node.active = false;
    }
    
    public getName(): string {
        return this.node.name;
    }

    public getNodeUID(): string {
        return this.node.uuid;
    }

    public onWeightLockStickerRemoved(sticker: ISticker): void {
        this._data.removeWeightLockSticker(sticker);
    }

    public onWeightLockObjectRemoved(holdableObject: IHoldableObject): void {
        this._data.removeWeightLockObject(holdableObject);
    }

    public onBlockingStickerRemoved(sticker: ISticker): void {
        this._data.removeBlockingSticker(sticker);
    }

    addListenerOnRemoved(listener: (sticker: ISticker) => void): void
    {
        this.onStickerRemoved.push(listener);
    }

    removeListenerOnRemoved(listener: (sticker: ISticker) => void): void
    {
        const index = this.onStickerRemoved.indexOf(listener);
        if (index !== -1)
        {
            this.onStickerRemoved.splice(index, 1);
        }
    }

    protected onDestroy(): void
    {
        this.onStickerRemoved = [];
    }
}


