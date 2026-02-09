import { _decorator, CCString, Component, Node, RigidBody } from 'cc';
import { IHoldableObject } from './IHoldableObject';
import { ISticker } from '../stickers/ISticker';
import { HodlablleData } from '../data/HodlablleData';
import { ILevelController } from '../../controllers/ILevelController';
const { ccclass, property } = _decorator;

@ccclass('HoldableObject')
export class HoldableObject extends Component implements IHoldableObject
{
    private _data: HodlablleData;
    private _levelController: ILevelController;
    
    @property(RigidBody) private rigidBody: RigidBody;

    @property([ CCString ]) public stickers: string[] = [];
    
    private onObjectRemoved: ((holdableObject: IHoldableObject) => void)[] = [];
    
    setup(level: ILevelController, stickers: ISticker[]): HodlablleData
    {
        this._levelController = level;
        this._data = new HodlablleData(stickers);
        return this._data;
    }
    
    addSticker(sticker: ISticker): void
    {
        this._data.addSticker(sticker);
    }
    
    removeSticker(sticker: ISticker): void
    {
        this._data.removeSticker(sticker);
        if (this._data.getStickerCount() <= 0)
        {
            this.freeObject();
        }
    }
    
    freeObject(): void
    {
        for (const listener of this.onObjectRemoved)
        {
            listener(this);
        }
        // this.rigidBody.isDynamic = true;
        this.node.active = false;
    }

    public getNodeUID(): string {
        return this.node.uuid;
    }

    public getName(): string {
        return this.node.name;
    }

    addListenerOnRemoved(listener: (holdableObject: IHoldableObject) => void): void
    {
        this.onObjectRemoved.push(listener);
    }

    removeListenerOnRemoved(listener: (holdableObject: IHoldableObject) => void): void
    {
        const index = this.onObjectRemoved.indexOf(listener);
        if (index !== -1)
        {
            this.onObjectRemoved.splice(index, 1);
        }
    }

    protected onDestroy(): void
    {
        this.onObjectRemoved = [];
    }

}


