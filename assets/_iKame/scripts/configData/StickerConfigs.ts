import { _decorator, Color, Material, Mesh } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';
import { StickerDataSO } from './StickerDataSO';
import { LetterDataSO } from './LetterDataSO';
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

    @property([ LetterDataSO ]) public letterDatas: LetterDataSO[] = [];
    @property(Material) public concaveMaterial: Material;
    
    private _mapLetterData: Map<string, LetterDataSO>;

    @property([Material])
    public textColors: Material[] = [];

    private static readonly _TextColorHexes =
    [
        "#5affff", // Cyan
        "#ee399a", // Pink
        "#ffe00f", // Yellow
        "#ff7f00", // Orange
        "#77f336", // Green
        "#ffaefa", // Light Pink
        "#0085eb", // Blue
        "#ff3333"  // Red
    ]
    
    public getLetterColor(letter: string): Material
    {
        const charIndex = letter.charCodeAt(0) - 'A'.charCodeAt(0);
        return this.textColors[charIndex % this.textColors.length];
    }

    public getLetterDataByLetter(letter: string): LetterDataSO | null 
    {
        if (!this._mapLetterData)
        {
            this._mapLetterData = new Map<string, LetterDataSO>();
            for (const letterData of this.letterDatas)
            {
                this._mapLetterData.set(letterData.letter, letterData);
            }
        }
        return this._mapLetterData.get(letter) || null;
    }

    public getLetterDatas(words: string): LetterDataSO[] {
        const result: LetterDataSO[] = [];
        for (const letter of words) {
            const letterData = this.getLetterDataByLetter(letter);
            if (letterData) {
                result.push(letterData);
            }
        }
        return result;
    }

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


