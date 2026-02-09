import { _decorator, CCInteger, Component, instantiate, Node, Prefab } from 'cc';
import { ILevelController } from './ILevelController';
import { LevelDataSO } from '../configData/LevelDataSO';
import { GameData } from '../gameplay/data/GameData';
import { BoxController } from './BoxController';
import { CacheController } from './CacheController';
import { DragRotateController } from '../commond/DragRotateController';
import { BlockPicker } from '../gameplay/BlockPicker';
import { HoldableObject } from '../gameplay/holdableObject/HoldableObject';
import { Sticker } from '../gameplay/stickers/Sticker';
import { PREVIEW } from 'cc/env';
import { ISticker } from '../gameplay/stickers/ISticker';
import { IHoldableObject } from '../gameplay/holdableObject/IHoldableObject';
import { HodlablleData } from '../gameplay/data/HodlablleData';
import { StickerData } from '../gameplay/data/StickerData';
import { FreeStickerPool } from '../gameplay/pooling/FreeStickerPool';
const { ccclass, property } = _decorator;

@ccclass('LevelController')
export class LevelController extends Component implements ILevelController
{
    @property([LevelDataSO]) public levelsData: LevelDataSO[] = [];
    @property(CCInteger) public levelIndex: number = 0;

    @property({ type: BoxController, group: "Controllers" }) public boxController: BoxController;
    @property({ type: CacheController, group: "Controllers" }) public cacheController: CacheController;
    @property({type : FreeStickerPool, group : "Pooling"}) public freeStickerPool : FreeStickerPool;
    @property(BlockPicker) public blockPicker: BlockPicker;

    private _gameData: GameData;

    private _stickerMap: Map<string, Sticker> = new Map<string, Sticker>();
    private _holdableMap: Map<string, HoldableObject> = new Map<string, HoldableObject>();

    protected onLoad(): void
    {
        this.blockPicker.levelController = this;
    }

    protected start(): void
    {
        this.spawnLevel();
    }

    spawnLevel()
    {
        const levelData = this.levelsData[ this.levelIndex ];
        var levelNode = instantiate(levelData.levelPrefab);
        levelNode.setParent(this.node);

        const holdableObjects = levelNode.getComponentsInChildren(HoldableObject);
        for (const holdableObject of holdableObjects)
        {
            this._holdableMap.set(holdableObject.getName(), holdableObject);
        }
        const stickers = levelNode.getComponentsInChildren(Sticker);
        for (const sticker of stickers)
        {
            this._stickerMap.set(sticker.getName(), sticker);
        }

        const holdableDatas: HodlablleData[] = [];
        for (const holdableObject of holdableObjects)
        {
            const stickersForObject: ISticker[] = [];
            for (const stickerName of holdableObject.stickers)
            {
                const sticker = this._stickerMap.get(stickerName);
                if (sticker)
                {
                    stickersForObject.push(sticker);
                }
            }
            holdableDatas.push(holdableObject.setup(this, stickersForObject));
        }

        const stickerDatas: StickerData[] = [];
        for (const sticker of stickers)
        {
            const blockingStickers: ISticker[] = [];
            for (const stickerName of sticker.blockingStickers)
            {
                const blockingSticker = this._stickerMap.get(stickerName);
                if (blockingSticker)
                {
                    blockingStickers.push(blockingSticker);
                }
            }
            const holdingObjects: IHoldableObject[] = [];
            for (const objectName of sticker.holdingObjects)
            {
                const holdableObject = this._holdableMap.get(objectName);
                if (holdableObject)
                {
                    holdingObjects.push(holdableObject);
                }
            }
            const weightLockStickers: ISticker[] = [];
            for (const stickerName of sticker.weightLockStickers)
            {
                const weightLockSticker = this._stickerMap.get(stickerName);
                if (weightLockSticker)
                {
                    weightLockStickers.push(weightLockSticker);
                }
            }
            const weightLockObjects: IHoldableObject[] = [];
            for (const objectName of sticker.weightLockObjects)
            {
                const holdableObject = this._holdableMap.get(objectName);
                if (holdableObject)
                {
                    weightLockObjects.push(holdableObject);
                }
            }
            const stickerData = sticker.setup(this, blockingStickers, holdingObjects, weightLockStickers, weightLockObjects);
            stickerDatas.push(stickerData);
        }

        const boxDatas = this.boxController.setup(levelData.maxBox);
        const cacheData = this.cacheController.setup(levelData.maxCache);

        this._gameData = new GameData(this.levelIndex, boxDatas, cacheData, stickerDatas, holdableDatas);
    }

    clearLevel(): void
    {
        this._holdableMap.clear();
        this._stickerMap.clear();
        this.node.destroyAllChildren();
    }

    doUpdate(deltaTime: number): void
    {

    }

    lateUpdate(deltaTime: number): void
    {

    }

    showTransparentBlocks(name: string, isTransparent: boolean): void
    {
        //TODO implement this function later
    }

    onPickObject(name: string): void
    {
        //TODO implement this function later
        if (PREVIEW) console.log("Picked object: " + name);
        const sticker = this._stickerMap.get(name);
        if (sticker)
        {
            sticker.tryPeelOff();
            return;
        }
    }
}


