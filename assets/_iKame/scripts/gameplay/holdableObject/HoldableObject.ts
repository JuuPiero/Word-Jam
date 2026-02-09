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
    private _levelController: ILevelController
    
    @property(RigidBody) private rigidBody: RigidBody;

    @property([CCString]) public stickers : string[] = [];
    
    setup(): HodlablleData
    {
        // TODO : Load stickers from names
        return this._data;
    }
    
    addSticker(sticker: ISticker): void
    {
        this._data.addSticker(sticker);
    }
    
    removeSticker(sticker: ISticker): void
    {
        this._data.removeSticker(sticker);
    }
    
    freeObject(): void
    {
        this.rigidBody.isDynamic = true;
    }

    public getNodeUID(): string {
        return this.node.uuid;
    }

    public getName(): string {
        return this.node.name;
    }

}


