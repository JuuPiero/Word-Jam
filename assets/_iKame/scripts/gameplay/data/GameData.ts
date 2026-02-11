import { LevelController } from "../../controllers/LevelController";
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

    private _lastPoint: number = 0;
    
    constructor(levelIndex: number, boxDatas : BoxData[], cacheData: CacheData, stickerDatas: StickerData[], holdableDatas: HoldablleData[]) {
        this.levelIndex = levelIndex;
        this._boxDatas = boxDatas;
        this._cacheData = cacheData;
        this._stickerDatas = new Set<StickerData>(stickerDatas);
        this._holdableDatas = new Set<HoldablleData>(holdableDatas);
    }

    public get StickerCountByIDMap(): Map<number, number>
    {
        this._stickerCountByIDMap.clear();
        this._stickerDatas.forEach((stickerData) => {
            const id = stickerData.id;
            const count = this._stickerCountByIDMap.get(id) || 0;
            this._stickerCountByIDMap.set(id, count + 1);
        });
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
        const param: NextTargetParams = new NextTargetParams();
        
        param.idCountRemainingDict = this.StickerCountByIDMap;

        const inCacheIDs = this._cacheData.getAllCachedIDs();
        inCacheIDs.forEach((id) =>
        {
            const count = param.idCountRemainingDict.get(id) || 0;
            param.idCountRemainingDict.set(id, count + 1);
        });
        
        param.idPointsDict.clear();
        this._stickerDatas.forEach((stickerData) =>
        {
            const v = param.idPointsDict.get(stickerData.id) || [];
            v.push(stickerData.getBlockingPoint());
            //sort v ascending
            v.sort((a, b) => a - b);
            param.idPointsDict.set(stickerData.id, v);
        });

        param.idPointDict.clear();
        const idList = this.TotalStickerIDs; 
        for (const id of idList)
        {
            const listPoints = param.idPointsDict.get(id);
            let loop = 3;
            let minPoint = 0;
            while (loop > 0)
            {
                loop--;
                const p = listPoints[loop] || 0;
                minPoint += p;
            }
            param.idPointDict.set(id, minPoint);
        }

        param.currentBoxesIdFreeSlotCount.clear();
        for (const boxData of this._boxDatas)
        {
            if (boxData.stickerID < 0) continue;
            const freeSlotCount = boxData.getEmptySlotCount();
            param.currentBoxesIdFreeSlotCount.set(boxData.stickerID, freeSlotCount);
        }

        param.currentBoxesIds = this._boxDatas.map(boxData => boxData.stickerID).filter(id => id >= 0);
        param.currentCacheIds = this._cacheData.getAllCachedIDs();
        param.difficultPoint = difficulty;
        param.freeHoleCount = this._cacheData.getEmptyCacheCount();
        param.lastPoint = this._lastPoint;
        
        const res = GameAlgorithmHelper.getNextTargetId(param)
        this._lastPoint = res.realPoint;
        if (res.targetId < 0) return null;
        return new BoxData(res.targetId);
    }

    public removeStickerData(stickerData : StickerData): void
    {
        this._stickerDatas.delete(stickerData);
    }
}