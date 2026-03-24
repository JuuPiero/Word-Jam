import { _decorator, CCString, Material, Mesh, MeshRenderer } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';
const { ccclass, property } = _decorator;

@bh.createAssetMenu('LetterDataSO', 'ScriptableAsset/LetterDataSO')
@bh.scriptable('LetterDataSO')
export class LetterDataSO extends bh.ScriptableAsset {
    @property(CCString) public letter: string = "A";
    @property(Mesh) public mesh: Mesh;
    @property(Material) public concaveMaterial: Material;
}


