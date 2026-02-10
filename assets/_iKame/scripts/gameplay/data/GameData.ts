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

    public getNewBoxData(): BoxData
    {
        /// set random at first, will be reset later
        /// TODO : optimize this by difficult level design
        const stickerIDs = this.TotalStickerIDs;
        const stickerID = stickerIDs[ Math.floor(Math.random() * stickerIDs.length) ];
        return new BoxData(stickerID);
    }
}