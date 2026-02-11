import { _decorator, AudioClip, Component, easing, game, MeshRenderer, Node, SpriteRenderer, tween, Tween, Vec3 } from 'cc';
import { BoxData } from '../data/BoxData';
import { StickerConfigs } from '../../configData/StickerConfigs';
import { BOX, STICKER } from '../../GameConstants';
import { PromiseDelay } from '../../utils/PromiseDelay';
import { IBoxController } from '../../controllers/IBoxController';
import { ISticker } from '../stickers/ISticker';
import { EventDispatcher } from '../../designPatterns/observer/EventDispatcher';
import { EventName } from '../../systems/EventName';
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

        
    @property(AudioClip) closeLidSound: AudioClip | null = null;
    @property(AudioClip) boxMoveUpSound: AudioClip | null = null;
    @property(AudioClip) boxRespawnSound: AudioClip | null = null;

    private _boxesController: IBoxController;
    private _stickers : ISticker[] = [];

    private _isReady: boolean = false;
    public get isReady(): boolean {
        return this._isReady;
    }

    public setup(boxesController: IBoxController, boxData: BoxData): BoxData
    {
        this.lidNode.active = false;
        this._boxesController = boxesController;
        this._boxData = boxData;
        this.updateData(this._boxData.stickerID, this._boxData.filledStickerCount);
        this._isReady = true;
        for (const s of this._stickers) {
            s.destroySticker();
        }
        this._stickers = [];
        return this._boxData;
    }

    public addSticker(sticker : ISticker): boolean
    {
        this._stickers.push(sticker);
        this._boxData.addFilledStickerCount(1);
        return this._boxData.isFull();
    }

    public getBoxData(): BoxData {
        return this._boxData;
    }

    public updateData(id: number, prefillCount: number = 0): void
    {
        this.lidNode.active = false;
        for (const s of this._stickers) {
            s.destroySticker();
        }
        this._stickers = [];
        this._boxData.reset(id, prefillCount);
        const stickerData = this.stickerConfigs.getStickerDataByID(this._boxData.stickerID);
        if (stickerData)
        {
            this.outLineSprites.forEach((spr) => {
                spr.spriteFrame = stickerData.stickerOutlineTexture;
            });
            this.iconSprite.spriteFrame = stickerData.stickerTexture;
            const mat = stickerData.boxMaterial;
            if (mat)
                this.meshVisual.setSharedMaterial(mat, 0);
        }
        if (prefillCount > 0) {
            this.createPreSpawnStickerNode();
        }
    }

    public resetData(id : number, filledStickerCount: number): void
    {
        this._boxData.reset(id, filledStickerCount);
    }

    public createPreSpawnStickerNode(): void 
    {
        const pos = new Vec3(0, 0, .07);
        for (let i = 0; i < this._boxData.filledStickerCount; i++)
        {
            const stickerNode = new Node('StickerInBox');
            stickerNode.setParent(this.slotNodes[i], false);
            stickerNode.setRotationFromEuler(0, 180, 0);
            stickerNode.setWorldScale(STICKER.IN_BOX_SCALE);
            stickerNode.setPosition(pos);
            const renderMesh = stickerNode.addComponent(MeshRenderer);
            renderMesh.mesh = this.stickerConfigs.stickerNormalMesh;
            const stickerData = this.stickerConfigs.getStickerDataByID(this._boxData.stickerID);
            renderMesh.setSharedMaterial(stickerData.stickerMaterial, 0);
        }
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
        EventDispatcher.dispatch(EventName.PlaySFX, this.closeLidSound);
        this.lidNode.active = true;
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
        await PromiseDelay.Wait(BOX.LID_CLOSE_DURATION + game.deltaTime);
    }

    public async moveUpAnimation(): Promise<void>
    {
        EventDispatcher.dispatch(EventName.PlaySFX, this.boxMoveUpSound);
        Tween.stopAllByTarget(this.root);
        this.root.setPosition(Vec3.ZERO);
        tween(this.root)
            .to(BOX.BOX_MOVE_UP_DURATION,
                {
                    position: BOX.BOX_MOVE_UP_POS
                },
                {
                    easing: easing.backIn,
                }
            )
            .start();
        await PromiseDelay.Wait(BOX.BOX_MOVE_UP_DURATION + game.deltaTime);
    }

    public async respawnAnimation(): Promise<void>
    {
        EventDispatcher.dispatch(EventName.PlaySFX, this.boxRespawnSound);
        Tween.stopAllByTarget(this.root);
        this.root.setPosition(BOX.BOX_START_DOWN_POS);
        this.root.setRotationFromEuler(BOX.BOX_START_DOWN_ROT);
        this.root.setScale(Vec3.ZERO);
        tween(this.root)
            .to(BOX.BOX_MOVE_UP_DURATION,
                {
                    position: Vec3.ZERO,
                    eulerAngles: Vec3.ZERO,
                    scale: Vec3.ONE
                },
                {
                    easing: 'sineInOut',
                }
            )
            .start();
        await PromiseDelay.Wait(BOX.BOX_MOVE_UP_DURATION + game.deltaTime);
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

    public getEmptySlotCount(): number
    {
        return this._boxData.getEmptySlotCount();
    }

    public shake(delay : number): void {
        Tween.stopAllByTarget(this.root);
        const shakeDuration = 0.16;
        const pos2 = new Vec3(0, 0, -.3)
        tween(this.root)
            .delay(delay)
            .to(shakeDuration * 0.4, { position: pos2 }, {easing: easing.circOut})
            .to(shakeDuration * 0.6, { position: Vec3.ZERO })
            .start();
    }
}


