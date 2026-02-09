import { _decorator, Component, Node, SpriteRenderer } from 'cc';
import { CacheData } from '../gameplay/data/CacheData';
const { ccclass, property } = _decorator;

const CACHE_SPACING = .56
@ccclass('CacheController')
export class CacheController extends Component
{
    private _data: CacheData;

    @property([SpriteRenderer])
    private cacheSlots: SpriteRenderer[] = [];

    private _activeCaches: SpriteRenderer[] = [];

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
}


