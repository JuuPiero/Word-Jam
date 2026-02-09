import { _decorator, CCInteger, Component, Material, Node, SpriteFrame, Texture2D } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';
const { ccclass, property } = _decorator;

@bh.createAssetMenu('StickerDataSO', 'ScriptableAsset/StickerDataSO')
@bh.scriptable('StickerDataSO')
export class StickerDataSO extends bh.ScriptableAsset
{
    @property(CCInteger) 
    public stickerID: number = 0;
    @property(SpriteFrame) 
    public stickerTexture: SpriteFrame | null = null;
    @property(SpriteFrame)
    public stickerOutlineTexture: SpriteFrame | null = null;
    @property(Material)
    public stickerMaterial: Material | null = null;
    @property(Material)
    public boxMaterial: Material | null = null;
}


