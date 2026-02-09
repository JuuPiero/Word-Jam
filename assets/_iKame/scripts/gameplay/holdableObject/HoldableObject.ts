import { _decorator, CCString, Component, Node, RigidBody } from 'cc';
import { IHoldableObject } from './IHoldableObject';
import { ISticker } from '../stickers/ISticker';
import { HodlablleData } from '../data/HodlablleData';
import { ILevelController } from '../../controllers/ILevelController';
import { EDITOR, PREVIEW } from 'cc/env';
const { ccclass, property } = _decorator;

@ccclass('HoldableObject')
export class HoldableObject extends Component implements IHoldableObject
{
    private _data: HodlablleData;
    private _levelController: ILevelController;
    
    @property(RigidBody) private rigidBody: RigidBody;

    @property([ CCString ]) public stickers: string[] = [];
    
    private onObjectRemoved: ((holdableObject: IHoldableObject) => void)[] = [];

    private _isCanUpdate : boolean = false;
    
    setup(level: ILevelController, stickers: ISticker[]): HodlablleData
    {
        this._levelController = level;
        this._data = new HodlablleData(stickers);
        this._isCanUpdate = true;
        return this._data;
    }

    protected lateUpdate(dt: number): void
    {
        if (!this._isCanUpdate || !EDITOR) return;
        this.stickers = this._data.getAllStickerNames();
    }
    
    addSticker(sticker: ISticker): void
    {
        this._data.addSticker(sticker);
    }
    
    removeSticker(sticker: ISticker): void
    {
        this._data.removeSticker(sticker);
        // if (EDITOR) console.log(`Sticker removed from HoldableObject: ${this.getName()} -> ${this._data.getStickerCount()} stickers left.`);
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


