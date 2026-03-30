import { _decorator, CCInteger, CCString, Collider, Component, easing, game, Mesh, MeshRenderer, Node, Tween, tween, Vec3 } from 'cc';
import { ISticker } from './ISticker';
import { IHoldableObject } from '../holdableObject/IHoldableObject';
import { ILevelController } from '../../controllers/ILevelController';
import { StickerData } from '../data/StickerData';
import { EDITOR } from 'cc/env';
import { STICKER } from '../../GameConstants';
import { PromiseDelay } from '../../utils/PromiseDelay';
import { LetterDataSO } from '../../configData/LetterDataSO';
const { ccclass, property } = _decorator;

const SHAKE_INTENSITY = 0.08;
const SHAKE_DURATION = 0.4;

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

    @property({ type: CCString })
    public letter: string = '';

    private _data: StickerData;
    private _levelController: ILevelController;

    private onStickerRemoved: ((sticker: ISticker) => void)[] = [];
    private _isCanUpdate: boolean = false;

    private tweenPeelObj: { value: number } = { value: 0 };

    @property(MeshRenderer)
    public meshRenderer: MeshRenderer | null = null;

    private ogPosition: Vec3 = new Vec3();

    private _letterData: LetterDataSO;

    protected start(): void
    {
        this.ogPosition.set(this.node.getPosition());
    }

    public setup(levelController: ILevelController,
        blockingStickers: ISticker[],
        holdingObjects: IHoldableObject[],
        weightLockStickers: ISticker[],
        weightLockObjects: IHoldableObject[],
        letter: string
    ): StickerData
    {
        this.letter = letter;
        this.meshRenderer = this.getComponent(MeshRenderer);

        this._levelController = levelController;
        this._data = new StickerData(
            this.letter,
            holdingObjects,
            blockingStickers,
            weightLockStickers,
            weightLockObjects
        );

        this._letterData = this._levelController.getLetterData(this.letter);
        if (!this._letterData) {
            console.error(`Letter data not found for letter: ${this.letter}`);
            return this._data;
        }
        this.meshRenderer.mesh = this._letterData.mesh;
        this.meshRenderer.setSharedMaterial(this._levelController.getLetterMaterial(letter), 0);

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
        if (this._tweenShaking) {
            this._tweenShaking.stop();
            this._tweenShaking = null;
        }
        this.onStickerRemoved = [];
    }

    private _tweebPeel: Tween<any> | null = null;
    private _tweenBlinking: Tween<any> | null = null;
    private _blinkingObj: { value: number } = { value: 0 };
    private _tweenShaking: Tween<any> | null = null;
    private _shakeOffset: Vec3 = new Vec3();

    public async playPeelAnimation(): Promise<void> 
    {
        const offsetForward = 0.16;
        Tween.stopAllByTarget(this.tweenPeelObj);
        Tween.stopAllByTarget(this.node);
        this.tweenPeelObj.value = 0;

        const startPos = this.node.getPosition();
        const upVec = new Vec3();
        upVec.set(this.node.up);
        Vec3.multiplyScalar(upVec, upVec, offsetForward);
        const endPos = new Vec3();
        Vec3.add(endPos, startPos, upVec);

        const pos = new Vec3();
    
        this._tweebPeel = tween(this.tweenPeelObj)
            .to(STICKER.PEEL_DURATION, { value: STICKER.PEEL_END_PROGRESS }, {
                easing: easing.circInOut,
                onUpdate: (target: any, ratio: number) =>
                {
                    Vec3.lerp(pos, startPos, endPos, ratio);
                    this.node.setPosition(pos);
                }
            })
            .start();
        
        await PromiseDelay.Wait(STICKER.PEEL_DURATION + game.deltaTime);
    }

    public destroySticker(): void
    {
        this.node.destroy();
    }

    public getBlockingPoint(): number
    {
        return this._data.getBlockingPoint();
    }

    public getLetter(): string
    {
        return this.letter;
    }

    public blinking(): void
    {
        if (this._tweenBlinking) {
            this._tweenBlinking.stop();
        }
        this._tweenBlinking = tween(this._blinkingObj)
            .to(0.2, { value: 1 }, { easing: easing.circInOut,
                onUpdate: (target: any, ratio: number) => {
                    const mat = this.meshRenderer.getMaterialInstance(0);
                    mat.setProperty('highlight', target.value);
                }
            })
            .to(0.2, { value: 0 }, { easing: easing.cubicIn,
                onUpdate: (target: any, ratio: number) => {
                    const mat = this.meshRenderer.getMaterialInstance(0);
                    mat.setProperty('highlight', target.value);
                }
            }).start();
    }

    public giveHintBlinking(): void
    {
        this.blinking();
        this.shaking();

        this._data.WeightLockStickers.forEach(s => {
            s.blinking();
            s.shaking();
        });
        this._data.BlockingStickers.forEach(s => {
            s.blinking();
            s.shaking();
        });
    }

    public shaking(): void
    {
        if (this._tweenShaking) {
            this._tweenShaking.stop();
            this._tweenShaking = null;
        }
        
        this._shakeOffset.set(0, 0, 0);
        const basePos = this.ogPosition.clone();
        const dummy = { t: 0 };
        
        this._tweenShaking = tween(dummy)
            .to(SHAKE_DURATION, { t: 1 }, {
                easing: easing.linear,
                onUpdate: (target: any, ratio: number) => {
                    const damp = 1 - ratio;
                    this._shakeOffset.set(
                        (Math.random() * 2 - 1) * SHAKE_INTENSITY * damp,
                        (Math.random() * 2 - 1) * SHAKE_INTENSITY * damp,
                        (Math.random() * 2 - 1) * SHAKE_INTENSITY * damp
                    );
                    this.node.setPosition(
                        basePos.x + this._shakeOffset.x,
                        basePos.y + this._shakeOffset.y,
                        basePos.z + this._shakeOffset.z
                    );
                }
            })
            .call(() => {
                this.node.setPosition(basePos);
                this._shakeOffset.set(0, 0, 0);
                this._tweenShaking = null;
            })
            .start();
    }

    public getData(): StickerData
    {
        return this._data;
    }
}