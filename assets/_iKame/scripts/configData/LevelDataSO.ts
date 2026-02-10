import { _decorator, CCInteger, Prefab, RealCurve } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';
const { ccclass, property } = _decorator;

@bh.createAssetMenu('LevelDataSO', 'ScriptableAsset/LevelDataSO')
@bh.scriptable('LevelDataSO')
export class LevelDataSO extends bh.ScriptableAsset {
    @property(Prefab) public levelPrefab: Prefab | null = null;
    @property(CCInteger) public maxBox: number = 4;
    @property(CCInteger) public maxCache: number = 5;
    @property(RealCurve) public diffCurve: RealCurve = new RealCurve();

    public evaluateDifficulty(t: number): number {
        return this.diffCurve.evaluate(t);
    }
}


