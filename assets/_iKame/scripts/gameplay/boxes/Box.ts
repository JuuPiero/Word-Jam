import { _decorator, Component, MeshRenderer, Node, SpriteRenderer } from 'cc';
import { BoxData } from '../data/BoxData';
import { StickerConfigs } from '../../configData/StickerConfigs';
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

    @property([ SpriteRenderer ]) public outLineSprites: SpriteRenderer[] = [];
    @property(SpriteRenderer) public iconSprite: SpriteRenderer;

    public setup(): BoxData
    {
        this._boxData = new BoxData(0);
        this.updateData(this._boxData.stickerID);
        return this._boxData;
    }

    public getBoxData(): BoxData {
        return this._boxData;
    }

    public updateData(id: number)
    {
        this._boxData.reset(id);
        const stickerData = this.stickerConfigs.getStickerDataByID(this._boxData.stickerID);
        this.outLineSprites.forEach((spr) => {
            spr.spriteFrame = stickerData.stickerOutlineTexture;
        });
        this.iconSprite.spriteFrame = stickerData.stickerTexture;
        const mat = stickerData.boxMaterial;
        if (mat)
            this.meshVisual.setSharedMaterial(mat, 0);
    }
}


