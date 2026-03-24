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
        this.updateData(this._boxData.word);
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

    public updateVisual(): void 
    {
        this.updateData(this._boxData.word);
    }

    public updateData(word: string): void
    {
        this.lidNode.active = false;
        for (const s of this._stickers) {
            s.destroySticker();
        }
        this._stickers = [];
        this._boxData.reset(word);
        const stickerDatas = this.stickerConfigs.getLetterDatas(word);
        if (stickerDatas.length)
        {
            //TODO: Set the box target word's icon here
        }
        //TODO: You may need to implement this incase the remaining letter aren't enough to form a word
        // if (prefillCount > 0) {
        //     this.createPreSpawnStickerNode();
        // }
    }

    public resetData(word : string): void
    {
        this._boxData.reset(word);
    }

    public createPreSpawnStickerNode(): void 
    {
        //TODO if you want to show the pre-filled stickers in the box, you can implement it here. You can use the sticker mesh & material from stickerConfigs to create the sticker node and set it as child of the slot node. You can refer to Sticker.ts for how to create the sticker node.
        // const pos = new Vec3(0, 0, .07);
        // for (let i = 0; i < this._boxData.filledStickerCount; i++)
        // {
        //     const stickerNode = new Node('StickerInBox');
        //     stickerNode.setParent(this.slotNodes[i], false);
        //     stickerNode.setRotationFromEuler(0, 180, 0);
        //     stickerNode.setWorldScale(STICKER.IN_BOX_SCALE);
        //     stickerNode.setPosition(pos);
        //     const renderMesh = stickerNode.addComponent(MeshRenderer);
        //     renderMesh.mesh = this.stickerConfigs.stickerNormalMesh;
        //     const stickerData = this.stickerConfigs.getStickerDataByID(this._boxData.word);
        //     renderMesh.setSharedMaterial(stickerData.stickerMaterial, 0);
        // }
    }

    public getEmptySlotNode(letter: string): Node 
    {
        const index = this._boxData.getFittingLetterSlot(letter);
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
        EventDispatcher.dispatch(EventName.PlaySFX, this.boxMoveUpSound, 0.37);
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
        this.resetData(data.word);
        await this.closeLidAnimation();
        await this.moveUpAnimation();
        this.updateVisual();
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


