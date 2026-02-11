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

        // 1. Đếm số lượng sticker còn lại cho từng ID (tương đương Id_CountRemaining_Dict)
        //    Sao chép map để tránh mutate dữ liệu gốc trong getter
        const idCountRemainingDict = new Map<number, number>(this.StickerCountByIDMap);
        param.idCountRemainingDict = idCountRemainingDict;

        // 2. Cộng thêm các sticker đang nằm trong cache (giống slot + storage trong Unity)
        const inCacheIDs = this._cacheData.getAllCachedIDs();
        inCacheIDs.forEach((id) =>
        {
            const count = param.idCountRemainingDict.get(id) || 0;
            param.idCountRemainingDict.set(id, count + 1);
        });

        // 3. Xây idPointsDict: danh sách điểm chặn cho từng ID (tương đương Id_Points_Dict)
        param.idPointsDict.clear();
        this._stickerDatas.forEach((stickerData) =>
        {
            const id = stickerData.id;
            let list = param.idPointsDict.get(id);
            if (!list)
            {
                list = [];
                param.idPointsDict.set(id, list);
            }
            list.push(stickerData.getBlockingPoint());
        });

        // Sắp xếp và tính tổng 3 điểm nhỏ nhất cho từng ID (tương đương Id_Point_Dict)
        param.idPointDict.clear();
        for (const [id, listPoints] of param.idPointsDict.entries())
        {
            listPoints.sort((a, b) => a - b);
            let totalPoint = 0;
            const loopCount = Math.min(3, listPoints.length);
            for (let i = 0; i < loopCount; i++)
            {
                totalPoint += listPoints[i];
            }
            param.idPointDict.set(id, totalPoint);
        }

        // Đảm bảo mọi ID trong idCountRemainingDict đều có entry trong idPointDict
        for (const id of param.idCountRemainingDict.keys())
        {
            if (!param.idPointDict.has(id))
            {
                param.idPointDict.set(id, 0);
            }
        }

        // 4. Thông tin các box đang active (chỉ tính box còn slot trống, giống Unity)
        param.currentBoxesIdFreeSlotCount.clear();
        param.currentBoxesIds = [];
        let totalFreeSlots = 0;
        for (const boxData of this._boxDatas)
        {
            if (boxData.stickerID < 0) continue;
            const freeSlotCount = boxData.getEmptySlotCount();
            if (freeSlotCount <= 0) continue;

            param.currentBoxesIdFreeSlotCount.set(boxData.stickerID, freeSlotCount);
            if (param.currentBoxesIds.indexOf(boxData.stickerID) === -1)
            {
                param.currentBoxesIds.push(boxData.stickerID);
            }
            totalFreeSlots += freeSlotCount;
        }

        // Nếu tổng số sticker còn lại <= tổng số slot trống hiện có thì không cần spawn box mới
        let totalStickers = 0;
        for (const count of param.idCountRemainingDict.values())
        {
            totalStickers += count;
        }
        if (totalStickers <= totalFreeSlots)
        {
            return null;
        }

        // 5. Cache IDs, độ khó, số slot trống & last point
        param.currentCacheIds = this._cacheData.getAllCachedIDs();
        param.difficultPoint = difficulty;
        param.freeHoleCount = this._cacheData.getEmptyCacheCount();
        param.lastPoint = this._lastPoint;

        const res = GameAlgorithmHelper.getNextTargetId(param);
        this._lastPoint = res.realPoint;
        if (res.targetId < 0) return null;

        //Double check xem ID này có trùng lặp với box đang hiện có không
        // nếu trùng thì lấy một ID khác trong danh sách đã tính toán được
        if (this._boxDatas.find(box => box.stickerID ===  res.targetId))
        {
            const stikerIdsRemains = this.TotalStickerIDs;
            for (const id of stikerIdsRemains)
            {
                if (id !== res.targetId && !this._boxDatas.find(box => box.stickerID ===  id))
                {
                    return new BoxData(id);
                }
            }
            return null;
        }

        return new BoxData(res.targetId);
    }

    public removeStickerData(stickerData : StickerData): void
    {
        this._stickerDatas.delete(stickerData);
    }
}