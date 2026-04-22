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

        const remainingWordLetters = this.getRemainingWordLetters();
        const letterPointsMap = this.buildLetterPointMap(remainingWordLetters);
        const candidates: { index: number; point: number }[] = [];

        for (let i = 0; i < this._wordPool.length; i++)
        {
            const word = this._wordPool[i];
            const wordPoint = this.evaluateWordPoint(word, letterPointsMap);
            if (wordPoint === null)
            {
                continue;
            }

            candidates.push({ index: i, point: wordPoint });
        }

        if (candidates.length === 0)
        {
            // Fallback if no candidate can be evaluated with current sticker state.
            const fallbackIndex = Math.floor(Math.random() * this._wordPool.length);
            const [fallbackWord] = this._wordPool.splice(fallbackIndex, 1);
            this._lastPoint = 0;
            return new BoxData(fallbackWord);
        }

        let minPoint = Number.POSITIVE_INFINITY;
        let maxPoint = Number.NEGATIVE_INFINITY;
        for (const candidate of candidates)
        {
            if (candidate.point < minPoint) minPoint = candidate.point;
            if (candidate.point > maxPoint) maxPoint = candidate.point;
        }

        const targetPoint = this.getTargetPointFromDifficulty(difficulty, minPoint, maxPoint);

        let bestWordIndex = candidates[0].index;
        let bestWordPoint = candidates[0].point;
        let bestDistance = Math.abs(candidates[0].point - targetPoint);

        for (let i = 1; i < candidates.length; i++)
        {
            const candidate = candidates[i];
            const distance = Math.abs(candidate.point - targetPoint);
            const shouldReplace =
                distance < bestDistance ||
                (distance === bestDistance && Math.abs(candidate.point - this._lastPoint) < Math.abs(bestWordPoint - this._lastPoint));

            if (shouldReplace)
            {
                bestDistance = distance;
                bestWordIndex = candidate.index;
                bestWordPoint = candidate.point;
            }
        }

        const [word] = this._wordPool.splice(bestWordIndex, 1);
        this._lastPoint = bestWordPoint;
        return new BoxData(word);
    }

    private getRemainingWordLetters(): Set<string>
    {
        const letters = new Set<string>();
        for (const word of this._wordPool)
        {
            for (const letter of word)
            {
                letters.add(letter);
            }
        }
        return letters;
    }

    private buildLetterPointMap(allowedLetters: Set<string>): Map<string, number[]>
    {
        const letterPointsMap = new Map<string, number[]>();
        for (const stickerData of this._stickerDatas)
        {
            const letter = stickerData.letter;
            if (!allowedLetters.has(letter))
            {
                continue;
            }
            const point = stickerData.getBlockingPoint();
            if (!letterPointsMap.has(letter))
            {
                letterPointsMap.set(letter, []);
            }
            letterPointsMap.get(letter).push(point);
        }

        for (const points of letterPointsMap.values())
        {
            points.sort((a, b) => a - b);
        }

        return letterPointsMap;
    }

    private getTargetPointFromDifficulty(difficulty: number, minPoint: number, maxPoint: number): number
    {
        if (!Number.isFinite(minPoint) || !Number.isFinite(maxPoint))
        {
            return 0;
        }

        if (difficulty >= 0 && difficulty <= 1)
        {
            return minPoint + (maxPoint - minPoint) * difficulty;
        }

        return Math.max(minPoint, Math.min(maxPoint, difficulty));
    }

    private evaluateWordPoint(word: string, letterPointsMap: Map<string, number[]>): number | null
    {
        const usedIndexByLetter = new Map<string, number>();
        let totalPoint = 0;

        for (const letter of word)
        {
            const points = letterPointsMap.get(letter);
            if (!points || points.length === 0)
            {
                return null;
            }

            const usedCount = usedIndexByLetter.get(letter) || 0;
            if (usedCount >= points.length)
            {
                return null;
            }

            totalPoint += points[usedCount];
            usedIndexByLetter.set(letter, usedCount + 1);
        }

        return totalPoint / Math.max(1, word.length);
    }

    public removeStickerData(stickerData : StickerData): void
    {
        this._stickerDatas.delete(stickerData);
    }
}