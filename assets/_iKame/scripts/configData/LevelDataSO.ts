import { _decorator, CCFloat, CCInteger, CCString, Prefab, RealCurve } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';
import { ColorDistributionConfig } from './ColorDistributionConfig';
const { ccclass, property } = _decorator;

@bh.createAssetMenu('LevelDataSO', 'ScriptableAsset/LevelDataSO')
@bh.scriptable('LevelDataSO')
export class LevelDataSO extends bh.ScriptableAsset {
    @property(Prefab) public levelPrefab: Prefab | null = null;
    @property(CCInteger) public maxBox: number = 4;
    @property(CCInteger) public maxCache: number = 5;
    @property(CCFloat) public curveScale : number = 1;
    @property(RealCurve) public diffCurve: RealCurve = new RealCurve();
    @property(CCString) public stickerTutName: string = "";
    @property(ColorDistributionConfig) public colorDistributionConfig: ColorDistributionConfig | null = null;

    public evaluateDifficulty(t: number): number {
        return this.diffCurve.evaluate(t) * this.curveScale;
    }

    @property([CCString])
    public targetWords: string[] = [];
}


