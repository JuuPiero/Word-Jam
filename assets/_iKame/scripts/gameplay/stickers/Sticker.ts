import { _decorator, CCInteger, CCString, Component, Node } from 'cc';
import { ISticker } from './ISticker';
import { IHoldableObject } from '../holdableObject/IHoldableObject';
import { StickerData } from '../../data/StickerData';
import { ILevelController } from '../ILevelController';
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

    public setup(levelController: ILevelController): StickerData
    {
        this._levelController = levelController;
        // TODO : Load holdable objects and stickers from names
        return this._data;
    }

    peelOff(): void
    {
        //TODO : Implement this function
    }
    
    public getName(): string {
        return this.node.name;
    }

    public getNodeUID(): string {
        return this.node.uuid;
    }
}


