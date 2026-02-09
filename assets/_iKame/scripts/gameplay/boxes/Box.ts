import { _decorator, Component, MeshRenderer, Node } from 'cc';
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

    public setup(): BoxData
    {
        this._boxData = new BoxData(-1);
        return this._boxData;
    }

    public getBoxData(): BoxData {
        return this._boxData;
    }

    public updateData(id: number)
    {
        this._boxData.reset(id);
        const stickerConfig = this.stickerConfigs.getStickerDataByID(this._boxData.stickerID);
        const mat = stickerConfig.boxMaterial;
        if (mat)
            this.meshVisual.setSharedMaterial(mat, 0);
    }
}


