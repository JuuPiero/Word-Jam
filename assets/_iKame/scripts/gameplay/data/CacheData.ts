export class CacheData {

    private _inCachesIDs: number[] = [];
    
    constructor(slotCount: number)
    {
        for (let i = 0; i < slotCount; i++) {
            this._inCachesIDs.push(-1);
        }
    }

    public isCachedFull(): boolean {
        for (const id of this._inCachesIDs) {
            if (id === -1) {
                return false;
            }
        }
        return true;
    }

    public isCacheTakenAt(index: number): boolean {
        return this._inCachesIDs[index] !== -1;
    }

    public setCacheAt(index: number, id: number): void {
        this._inCachesIDs[index] = id;
    }

    public clearCacheAt(index: number): void {
        this._inCachesIDs[index] = -1;
    }
}


