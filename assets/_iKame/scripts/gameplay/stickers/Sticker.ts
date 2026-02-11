import { _decorator, CCInteger, CCString, Collider, Component, easing, game, Mesh, MeshRenderer, Node, Tween, tween, Vec3 } from 'cc';
import { ISticker } from './ISticker';
import { IHoldableObject } from '../holdableObject/IHoldableObject';
import { ILevelController } from '../../controllers/ILevelController';
import { StickerData } from '../data/StickerData';
import { EDITOR } from 'cc/env';
import { STICKER } from '../../GameConstants';
import { PromiseDelay } from '../../utils/PromiseDelay';
const { ccclass, property } = _decorator;

@ccclass('Sticker')
export class Sticker extends Component implements ISticker
{
    @property({ type: [ CCString ] })
    public blockingStickers : string[] = [];

    @property({ type: [ CCString ] })
    public holdingObjects: string[] = [];
    
    @property({ type: [ CCString ] })
    public weightLockStickers: string[] = [];

    @property({ type: [ CCString ] })
    public weightLockObjects: string[] = [];

    @property({ type: CCInteger })
    public stickerID: number = 0;

    private _data: StickerData;
    private _levelController: ILevelController;

    private onStickerRemoved: ((sticker: ISticker) => void)[] = [];
    private _isCanUpdate: boolean = false;

    private tweenPeelObj: { value: number } = { value: 0 };

    private meshRenderer: MeshRenderer | null = null;

    public setup(levelController: ILevelController,
        blockingStickers: ISticker[],
        holdingObjects: IHoldableObject[],
        weightLockStickers: ISticker[],
        weightLockObjects: IHoldableObject[]
    ): StickerData
    {
        this.meshRenderer = this.getComponent(MeshRenderer);

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

        this._isCanUpdate = true;
        return this._data;
    }

    protected lateUpdate(dt: number): void
    {
        if (!this._isCanUpdate || !EDITOR) return;
        this.blockingStickers = this._data.getAllBlockingStickerNames();
        this.holdingObjects = this._data.getAllHoldingObjectNames();
        this.weightLockStickers = this._data.getAllWeightLockStickerNames();
        this.weightLockObjects = this._data.getAllWeightLockObjectNames();
    }

    public canPeelOff(): boolean
    {
        return this._data.getWeightLockObjectCount() === 0 &&
               this._data.getWeightLockStickerCount() === 0 &&
               this._data.getBlockingStickerCount() === 0;
    }

    public tryPeelOff(): Promise<void> | undefined
    {
        if (!this.canPeelOff()) {
            return undefined;
        }
        console.log("Peeling off sticker: " + this.getName());
        return this.peelOff();
    }

    peelOff(): Promise<void>
    {
        for (const holdableObject of this._data.HoldingObjects)
        {
            holdableObject.removeSticker(this);
        }
        this._data.clearHoldingObjects();
        for (const listener of this.onStickerRemoved) {
            listener(this);
        }
        // this.node.active = false;
        this.node.getComponent(Collider).enabled = false;
        return this.playPeelAnimation();
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
        if (this._tweebPeel) {
            this._tweebPeel.stop();
            this._tweebPeel = null;
        }
        this.onStickerRemoved = [];
    }

    private _tweebPeel : Tween<any> | null = null;

    public async playPeelAnimation(): Promise<void> 
    {
        const offsetForward = 0.1;
        Tween.stopAllByTarget(this.tweenPeelObj);
        Tween.stopAllByTarget(this.node);
        this.tweenPeelObj.value = 0;
        const mat = this.meshRenderer.getMaterialInstance(0);

        const startPos = this.node.getPosition();
        const upVec = new Vec3();
        upVec.set(this.node.forward);
        Vec3.multiplyScalar(upVec, upVec, offsetForward);
        const endPos = new Vec3();
        Vec3.add(endPos, startPos, upVec);
    
        this._tweebPeel = tween(this.tweenPeelObj)
            .to(STICKER.PEEL_DURATION, { value: STICKER.PEEL_END_PROGRESS }, {
                easing: easing.circInOut,
                onUpdate: (target: any, ratio: number) => {
                    mat.setProperty('peel', target.value);
                }
            })
            .start();
        
        await PromiseDelay.Wait(STICKER.PEEL_DURATION + game.deltaTime);
    }

    public setNormalMesh (mesh : Mesh) : void 
    {
        if (this._tweebPeel) {
            this._tweebPeel.stop();
            this._tweebPeel = null;
        }
        const mat = this.meshRenderer.getMaterialInstance(0);
        mat.setProperty('peel', 0);
        this.meshRenderer.mesh = mesh;
        const pos = this.node.getPosition();
        Vec3.scaleAndAdd(pos, pos, this.node.forward, 0.1);
        this.node.setPosition(pos);
    }

    public setPeelProgress(progress: number): void
    {
        if (this._tweebPeel) {
            this._tweebPeel.stop();
            this._tweebPeel = null;
        }
        const mat = this.meshRenderer.getMaterialInstance(0);
        mat.setProperty('peel', progress);
    }

    public destroySticker(): void
    {
        this.node.destroy();
    }

    public getBlockingPoint(): number
    {
        return this._data.getBlockingPoint();
    }

    public getStickerID(): number
    {
        return this.stickerID;
    }
}


