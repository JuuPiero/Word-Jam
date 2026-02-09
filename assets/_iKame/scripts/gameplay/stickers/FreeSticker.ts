import { _decorator, Component, easing, EventKeyboard, Input, input, KeyCode, MeshRenderer, Node, tween, Tween, Vec3 } from 'cc';
import { StickerConfigs } from '../../configData/StickerConfigs';
import { STICKER } from '../../GameConstants';
import { PromiseDelay } from '../../utils/PromiseDelay';
const { ccclass, property } = _decorator;

@ccclass('FreeSticker')
export class FreeSticker extends Component {
    @property(StickerConfigs) public stickerConfigs: StickerConfigs;
    @property(MeshRenderer) public meshRenderer: MeshRenderer;

    private _stickerID: number = -1;
    private tweenPeelObj: { value: number } = { value: 0 };
    
    protected start(): void
    {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown(event: EventKeyboard): void
    {
        if (event.keyCode === KeyCode.SPACE) {
            this.playPeelAnimation();
        }
    }

    public setup(stickerID: number): void
    {
        this._stickerID = stickerID;
        const stickerConfig = this.stickerConfigs.getStickerDataByID(this._stickerID);
        const mat = stickerConfig.stickerMaterial;
        this.meshRenderer.setSharedMaterial(mat, 0);
    }

    public async playPeelAnimation(): Promise<void> 
    {
        Tween.stopAllByTarget(this.tweenPeelObj);
        const targetNode = this.meshRenderer.node;
        Tween.stopAllByTarget(targetNode);
        this.tweenPeelObj.value = 0;
        const mat = this.meshRenderer.getMaterialInstance(0);
    
        tween(this.tweenPeelObj)
            .to(STICKER.PEEL_DURATION, { value: STICKER.PEEL_END_PROGRESS }, {
                easing: easing.circInOut,
                onUpdate: (target: any, ratio: number) => {
                    mat.setProperty('peel', target.value);
                }
            })
            .start();
        
        const delay = PromiseDelay.GetCancelablePromise(STICKER.PEEL_DURATION);
        await delay.wait();

        const p = targetNode.getWorldPosition();
        // Vec3.scaleAndAdd(p, p, Vec3.UP, STICKER.AFTER_PEEL_WORLD_POSITION_OFFSET);
        targetNode.setWorldPosition(p);

        targetNode.setScale(STICKER.AFTER_PEEL_START_SCALE);
        targetNode.setWorldRotationFromEuler(0, 180, 0);
        mat.setProperty('peel', 0);
        Tween.stopAllByTarget(targetNode);
        tween(targetNode)
            .to(STICKER.AFTER_PEEL_DURATION, { scale: STICKER.AFTER_PEEL_END_SCALE }, { easing: easing.backOut })
            .start();
        
        const delay2 = PromiseDelay.GetCancelablePromise(STICKER.AFTER_PEEL_DURATION);
        await delay2.wait();
    }
}


