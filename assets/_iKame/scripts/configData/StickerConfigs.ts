import { _decorator, Material, Mesh } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';
import { StickerDataSO } from './StickerDataSO';
const { ccclass, property } = _decorator;

@bh.createAssetMenu('StickerConfigs', 'ScriptableAsset/StickerConfigs')
@bh.scriptable('StickerConfigs')
export class StickerConfigs extends bh.ScriptableAsset {
   
    @property([StickerDataSO])
    private stickerDatas: StickerDataSO[] = [];

    private _mapStickerData: Map<number, StickerDataSO> | null = null;

    @property(Mesh) public stickerNormalMesh: Mesh;

    @property(Material) public objectNormalMaterial: Material;
    @property(Material) public objectTransparentMaterial: Material;

    public getStickerDataByID(stickerID: number): StickerDataSO | null {
        if (!this._mapStickerData) {
            this._mapStickerData = new Map<number, StickerDataSO>();
            for (const stickerData of this.stickerDatas) {
                this._mapStickerData.set(stickerData.stickerID, stickerData);
            }
        }
        return this._mapStickerData.get(stickerID) || null;
    }
}


