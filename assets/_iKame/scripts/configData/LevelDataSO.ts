import { _decorator, CCFloat, CCInteger, CCString, JsonAsset, Prefab, RealCurve } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';
import { ColorDistributionConfig } from './ColorDistributionConfig';
import { shuffleArray } from '../utils/MathUtils';
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
    @property(JsonAsset) targetTextJson: JsonAsset | null = null;
    public evaluateDifficulty(t: number): number {
        return this.diffCurve.evaluate(t) * this.curveScale;
    }

    private _targetWords: string[] = [];

    public getTargetWords(): string[]
    {
        if (this._targetWords.length === 0 && this.targetTextJson) {
            this._targetWords = this.targetTextJson.json as string[];
            shuffleArray    (this._targetWords); // Shuffle the target words for more variety
        }
        return this._targetWords;
    }

    public getAllLetters(): string[]
    {
        const letters: string[] = [];
        for (const word of this.getTargetWords())
        {
            for (const letter of word)
            {
                letters.push(letter);
            }
        }
        shuffleArray(letters); // Shuffle the letters for more variety
        return letters;
    }
}


