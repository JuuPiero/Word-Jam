import { _decorator, Component, game, Node, SpriteRenderer, Vec3 } from 'cc';
import { CacheData } from '../gameplay/data/CacheData';
import { Sticker } from '../gameplay/stickers/Sticker';
const { ccclass, property } = _decorator;

const CACHE_SPACING = .56
@ccclass('CacheController')
export class CacheController extends Component
{
    private _data: CacheData;

    @property([SpriteRenderer])
    private cacheSlots: SpriteRenderer[] = [];

    private _activeCaches: SpriteRenderer[] = [];

    private isStickerInPlace: boolean[] = [];

    private _stickes : Sticker[] = [];

    setup(count: number): CacheData
    {
        this._data = new CacheData(count);

        for (let i = 0; i < this.cacheSlots.length; i++)
        {
            const box = this.cacheSlots[i];
            if (i >= count)
            {
                box.node.active = false;
                continue;
            }
            this._activeCaches.push(box);
            this.isStickerInPlace.push(false);
            this._stickes.push(null);
        }

        let centerX = 0
        for (let i = 0; i < this._activeCaches.length; i++)
        {
            centerX += i * CACHE_SPACING;
        }
        const offsetX = centerX / this._activeCaches.length;
        for (let i = 0; i < this._activeCaches.length; i++)
        {
            this._activeCaches[i].node.active = true;
            this._activeCaches[ i ].node.setPosition(i * CACHE_SPACING - offsetX, 0, 0);
        }

        return this._data;
    }

    public getNextEmptyCache(outPosition: Vec3): number
    {
        for (let i = 0; i < this._activeCaches.length; i++)
        {
            if (!this._data.isCacheTakenAt(i))
            {
                const pos = this._activeCaches[ i ].node.getWorldPosition();
                Vec3.scaleAndAdd(pos, pos, this._activeCaches[ i ].node.forward, -0.1);
                Vec3.copy(outPosition, pos);
                return i;
            }
        }
        return -1;
    }

    public setCache(index: number, id: number, sticker: Sticker): void
    {
        this._data.setCacheAt(index, id);
        this._stickes[index] = sticker;
    }

    public setStickerInPlace(index: number, inPlace: boolean): void
    {
        this.isStickerInPlace[index] = inPlace;
    }

    public getCachedId(indexSlot: number): number
    {
        return this._data.getCacheAt(indexSlot);
    }

    public getStickerAt(indexSlot: number): Sticker
    {
        return this._stickes[indexSlot];
    }

    public isStickerReady(index: number): boolean
    {
        return this.isStickerInPlace[index];
    }

    public findFirstStickerWithID(id: number): {slotIndex: number, sticker: Sticker} | null
    {
        for (let i = 0; i < this._activeCaches.length; i++)
        {
            if (this._data.getCacheAt(i) === id)
            {
                return { slotIndex: i, sticker: this._stickes[i] };
            }
        }
        return null;
    }
}


