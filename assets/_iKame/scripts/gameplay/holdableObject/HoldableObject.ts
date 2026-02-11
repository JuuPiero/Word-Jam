import { _decorator, CCString, Component, Material, MeshCollider, MeshRenderer, Node, RigidBody, Vec3 } from 'cc';
import { IHoldableObject } from './IHoldableObject';
import { ISticker } from '../stickers/ISticker';
import { HodlablleData } from '../data/HodlablleData';
import { ILevelController } from '../../controllers/ILevelController';
import { EDITOR, PREVIEW } from 'cc/env';
import { PHYSIC_GROUP } from '../../GameConstants';
const { ccclass, property } = _decorator;

@ccclass('HoldableObject')
export class HoldableObject extends Component implements IHoldableObject
{
    private _data: HodlablleData;
    private _levelController: ILevelController;
    public rigidBody: RigidBody;

    @property([ CCString ]) public stickers: string[] = [];
    
    private onObjectRemoved: ((holdableObject: IHoldableObject) => void)[] = [];

    private _isCanUpdate: boolean = false;
    
    private mainMeshRender: MeshRenderer | null = null;

    private originalMaterials: Material[] | null = null;

    private ensureRenderer(): MeshRenderer | null
    {
        if (!this.mainMeshRender)
        {
            this.mainMeshRender = this.getComponent(MeshRenderer);
        }
        return this.mainMeshRender;
    }

    private cacheOriginalMaterialsIfNeeded(): void
    {
        const renderer = this.ensureRenderer();
        if (!renderer) return;
        if (this.originalMaterials) return;

        // IMPORTANT: sharedMaterials is a live array; keep a snapshot copy.
        this.originalMaterials = renderer.sharedMaterials.slice();
    }

    protected onLoad(): void
    {
        // Helps if setMaterialTrans() gets called before start().
        this.ensureRenderer();
    }

    protected start(): void
    {
        this.ensureRenderer();
        this.cacheOriginalMaterialsIfNeeded();
    }
    
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

    private force : Vec3 = new Vec3(0, 0.2, 0);
    
    freeObject(): void
    {
        for (const listener of this.onObjectRemoved)
        {
            listener(this);
        }
        this.rigidBody = this.node.getComponent(RigidBody)!;
        // this.rigidBody.group = PHYSIC_GROUP.FREE;
        this.rigidBody.isDynamic = true;
        const col = this.node.getComponent(MeshCollider);
        col.convex = true;
        this.rigidBody.linearDamping = 0.01;
        this.rigidBody.angularDamping = 0.01;
        this.rigidBody.applyForce(this.force);
        this.node.setParent(this._levelController.getNode(), true);
        this.scheduleOnce(() =>
        {
            this.node.active = false;
        }, 30);
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

    public setMaterialTrans(mat: Material | null)
    {
        const renderer = this.ensureRenderer();
        if (!renderer) return;

        if (mat)
        {
            this.cacheOriginalMaterialsIfNeeded();
            const count = renderer.sharedMaterials.length;
            for (let i = 0; i < count; i++)
            {
                renderer.setSharedMaterial(mat, i);
            }
            return;
        }

        if (!this.originalMaterials)
        {
            // No snapshot captured (likely never applied a temp material). Nothing to restore.
            return;
        }

        if (PREVIEW || EDITOR) console.log('Resetting material to original', this.originalMaterials);
        const restoreCount = Math.min(renderer.sharedMaterials.length, this.originalMaterials.length);
        for (let k = 0; k < restoreCount; k++)
        {
            renderer.setSharedMaterial(this.originalMaterials[k], k);
        }
    }

}


