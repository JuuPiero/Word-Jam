import { _decorator, Component, MeshRenderer, Node, SpriteRenderer, tween, Tween, Vec3 } from 'cc';
import { BoxData } from '../data/BoxData';
import { StickerConfigs } from '../../configData/StickerConfigs';
import { BOX } from '../../GameConstants';
import { PromiseDelay } from '../../utils/PromiseDelay';
import { IBoxController } from '../../controllers/IBoxController';
const { ccclass, property } = _decorator;

@ccclass('Box')
export class Box extends Component {
    
    private _boxData: BoxData;
    @property(MeshRenderer)
    private meshVisual: MeshRenderer;
    @property([ Node ])
    private slotNodes: Node[] = [];
    @property(StickerConfigs)
    private stickerConfigs: StickerConfigs;
    @property(Node) root: Node;
    @property(Node) lidNode: Node;

    @property([ SpriteRenderer ]) public outLineSprites: SpriteRenderer[] = [];
    @property(SpriteRenderer) public iconSprite: SpriteRenderer;

    private _boxesController: IBoxController;

    private _isReady: boolean = false;
    public get isReady(): boolean {
        return this._isReady;
    }

    public setup(boxesController: IBoxController): BoxData
    {
        this._boxesController = boxesController;
        this._boxData = new BoxData(0);
        this.updateData(this._boxData.stickerID);
        this._isReady = true;
        return this._boxData;
    }

    public addSticker(count: number = 1): boolean
    {
        this._boxData.addFilledStickerCount(count);
        return this._boxData.isFull();
    }

    public getBoxData(): BoxData {
        return this._boxData;
    }

    public updateData(id: number, prefillCount: number = 0): void
    {
        this._boxData.reset(id, prefillCount);
        const stickerData = this.stickerConfigs.getStickerDataByID(this._boxData.stickerID);
        this.outLineSprites.forEach((spr) => {
            spr.spriteFrame = stickerData.stickerOutlineTexture;
        });
        this.iconSprite.spriteFrame = stickerData.stickerTexture;
        const mat = stickerData.boxMaterial;
        if (mat)
            this.meshVisual.setSharedMaterial(mat, 0);
    }

    public getEmptySlotNode(): Node 
    {
        const index = this._boxData.filledStickerCount;
        if (index < this.slotNodes.length) {
            return this.slotNodes[index];
        }
        return null;
    }

    public async closeLidAnimation(): Promise<void>
    {
        Tween.stopAllByTarget(this.lidNode);
        this.lidNode.setRotationFromEuler(BOX.LID_OPEN_ROT);
        this.lidNode.setPosition(BOX.LID_OPEN_POS);
        tween(this.lidNode)
        .to(BOX.LID_CLOSE_DURATION,
            {
                position: BOX.LID_CLOSE_POS,
                eulerAngles: Vec3.ZERO
            },
            {
                easing: 'sineInOut',
            }
        )
        .start();
        await PromiseDelay.GetCancelablePromise(BOX.LID_CLOSE_DURATION).wait();
    }

    public async moveUpAnimation(): Promise<void>
    {
        Tween.stopAllByTarget(this.root);
        const startPos = this.root.getPosition();
        tween(this.root)
            .to(BOX.BOX_MOVE_UP_DURATION,
                {
                    position: BOX.BOX_MOVE_UP_POS
                },
                {
                    easing: 'sineInOut',
                }
            )
            .start();
        await PromiseDelay.GetCancelablePromise(BOX.BOX_MOVE_UP_DURATION).wait();
    }

    public async respawnAnimation(): Promise<void>
    {
        Tween.stopAllByTarget(this.root);
        this.root.setPosition(BOX.BOX_START_DOWN_POS);
        this.root.setRotationFromEuler(BOX.BOX_START_DOWN_ROT);
        tween(this.root)
            .to(BOX.BOX_MOVE_UP_DURATION,
                {
                    position: BOX.BOX_MOVE_UP_POS,
                    eulerAngles: Vec3.ZERO
                },
                {
                    easing: 'sineInOut',
                }
            )
            .start();
        await PromiseDelay.GetCancelablePromise(BOX.BOX_MOVE_UP_DURATION).wait();
    }

    public async replaceBox(data: BoxData): Promise<void>
    {
        this._isReady = false;
        await this.closeLidAnimation();
        await this.moveUpAnimation();
        this.updateData(data.stickerID, data.filledStickerCount);
        await this.respawnAnimation();
        this._isReady = true;
    }

}


