import { math } from "cc";
import { LevelController } from "../../controllers/LevelController";
import { shuffleArray } from "../../utils/MathUtils";
import { GameAlgorithmHelper, NextTargetParams } from "../difficulty/GameAlgorithmHelper";
import { BoxData } from "./BoxData";
import { CacheData } from "./CacheData";
import { HodlablleData as HoldablleData } from "./HodlablleData";
import { StickerData } from "./StickerData";

export class GameData
{
    private levelIndex: number = 0;

    private _boxDatas: BoxData[];
    private _cacheData: CacheData;
    private _stickerDatas: Set<StickerData>;
    private _holdableDatas: Set<HoldablleData>;

    private _stickerCountByIDMap: Map<number, number> = new Map<number, number>();

    private _wordPool : string [] = [];

    private _lastPoint: number = 0;
    
    constructor(levelIndex: number,
        boxDatas: BoxData[],
        cacheData: CacheData,
        stickerDatas: StickerData[],
        holdableDatas: HoldablleData[],
        wordPool: string[]
    )
    {
        this.levelIndex = levelIndex;
        this._boxDatas = boxDatas;
        this._cacheData = cacheData;
        this._wordPool = wordPool;
        this._stickerDatas = new Set<StickerData>(stickerDatas);
        this._holdableDatas = new Set<HoldablleData>(holdableDatas);
    }

    public get StickerCountByIDMap(): Map<number, number>
    {
        //TODO: optimize by maintaining this map incrementally when add/remove sticker data instead of recalculating from scratch every time
        this._stickerCountByIDMap.clear();
        // this._stickerDatas.forEach((stickerData) => {
        //     const id = stickerData.letter;
        //     const count = this._stickerCountByIDMap.get(id) || 0;
        //     this._stickerCountByIDMap.set(id, count + 1);
        // });
        return this._stickerCountByIDMap;
    }

    public get TotalStickerIDs(): number[]
    {
        return Array.from(this.StickerCountByIDMap.keys());
    }

    public get DifferentStickerCount(): number
    {
        return this.StickerCountByIDMap.size;
    }

    public getNewBoxData(difficulty : number): BoxData
    {
        if (this._wordPool.length === 0)
        {
            return null;
        }
        if (this._wordPool.length === 1)
        {
            const word = this._wordPool.pop();
            const boxData = new BoxData(word);
            return boxData;
        }

        const index = math.randomRangeInt(0, this._wordPool.length);
        const word = this._wordPool[ index ];
        this._wordPool.splice(index, 1);
        const boxData = new BoxData(word);
        return boxData;
    }

    public removeStickerData(stickerData : StickerData): void
    {
        this._stickerDatas.delete(stickerData);
    }
}