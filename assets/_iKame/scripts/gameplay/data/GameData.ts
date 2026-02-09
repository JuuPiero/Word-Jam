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
    
    constructor(levelIndex: number, boxDatas : BoxData[], cacheData: CacheData, stickerDatas: StickerData[], holdableDatas: HoldablleData[]) {
        this.levelIndex = levelIndex;
        this._boxDatas = boxDatas;
        this._cacheData = cacheData;
        this._stickerDatas = new Set<StickerData>(stickerDatas);
        this._holdableDatas = new Set<HoldablleData>(holdableDatas);
    }
}