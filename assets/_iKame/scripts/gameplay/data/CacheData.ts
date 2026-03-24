import { EMPTY_LETTER } from "../../GameConstants";

export class CacheData {

    private _inCachesLetters: string[] = [];
    
    constructor(slotCount: number)
    {
        for (let i = 0; i < slotCount; i++) {
            this._inCachesLetters.push(EMPTY_LETTER);
        }
    }

    public isCachedFull(): boolean {
        for (const id of this._inCachesLetters) {
            if (id === EMPTY_LETTER) {
                return false;
            }
        }
        return true;
    }

    public isCacheTakenAt(index: number): boolean {
        return this._inCachesLetters[index] !== EMPTY_LETTER;
    }

    public setCacheAt(index: number, id: string): void {
        this._inCachesLetters[index] = id;
    }

    public clearCacheAt(index: number): void {
        this._inCachesLetters[index] = EMPTY_LETTER;
    }

    public getCacheAt(index: number): string {
        return this._inCachesLetters[index];
    }

    public getAllCachedIDs(): string[] {
        return this._inCachesLetters.filter(id => id !== EMPTY_LETTER);
    }

    public getEmptyCacheCount(): number {
        let count = 0;
        for (const id of this._inCachesLetters) {
            if (id === EMPTY_LETTER) {
                count++;
            }
        }
        return count;
    }
}


