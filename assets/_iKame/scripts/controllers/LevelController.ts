import { _decorator, CCInteger, Component, easing, game, instantiate, Node, Prefab, Quat, Tween, tween, Vec3 } from 'cc';
import { ILevelController } from './ILevelController';
import { LevelDataSO } from '../configData/LevelDataSO';
import { GameData } from '../gameplay/data/GameData';
import { BoxController } from './BoxController';
import { CacheController } from './CacheController';
import { BlockPicker } from '../gameplay/BlockPicker';
import { HoldableObject } from '../gameplay/holdableObject/HoldableObject';
import { Sticker } from '../gameplay/stickers/Sticker';
import { EDITOR, PREVIEW } from 'cc/env';
import { ISticker } from '../gameplay/stickers/ISticker';
import { IHoldableObject } from '../gameplay/holdableObject/IHoldableObject';
import { HodlablleData } from '../gameplay/data/HodlablleData';
import { StickerData } from '../gameplay/data/StickerData';
import { Box } from '../gameplay/boxes/Box';
import { PromiseDelay } from '../utils/PromiseDelay';
import { StickerConfigs } from '../configData/StickerConfigs';
import { STICKER } from '../GameConstants';
import { BoxData } from '../gameplay/data/BoxData';
import { EventName } from '../gameSystems/EventName';
import { EventDispatcher } from '../designPatterns/observer/EventDispatcher';
const { ccclass, property } = _decorator;

const FRAME_SKIP = 5;

@ccclass('LevelController')
export class LevelController extends Component implements ILevelController
{

    @property([LevelDataSO]) public levelsData: LevelDataSO[] = [];
    @property(CCInteger) public levelIndex: number = 0;

    @property({ type: BoxController, group: "Controllers" }) public boxController: BoxController;
    @property({ type: CacheController, group: "Controllers" }) public cacheController: CacheController;
    @property(BlockPicker) public blockPicker: BlockPicker;
    @property({type : StickerConfigs, group : "ConfigData"}) public stickerConfigs : StickerConfigs;

    private _gameData: GameData;

    private _stickerMap: Map<string, Sticker> = new Map<string, Sticker>();
    private _holdableMap: Map<string, HoldableObject> = new Map<string, HoldableObject>();

    private _justCompletedBoxes: Set<Box> = new Set<Box>();
    private _justCachedSlots: Set<number> = new Set<number>();

    @property(Node) private rotationRoot: Node;

    private _isLevelFinished: boolean = false;

    private totalStickerCount: number = 0;

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
        levelNode.setParent(this.rotationRoot, false);

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

        this.boxController.setup(levelData.maxBox, this);
        const cacheData = this.cacheController.setup(levelData.maxCache);
        const boxDatas = this.boxController.getBoxesDataList();
        this._gameData = new GameData(this.levelIndex, boxDatas, cacheData, stickerDatas, holdableDatas);
        this.boxController.setupFirstBoxes();

        this.totalStickerCount = stickerDatas.length;

        this._isLevelFinished = false;
    }

    clearLevel(): void
    {
        this._holdableMap.clear();
        this._stickerMap.clear();
        this._justCompletedBoxes.clear();
        this._justCachedSlots.clear();
        this.node.destroyAllChildren();
    }

    //TODO: Remove this function later
    protected update(dt: number): void
    {
        this.doUpdate(dt);
    }

    private _frameCount: number = 0;

    doUpdate(deltaTime: number): void
    {
        this._frameCount++;
        if (this._frameCount % FRAME_SKIP === 0)
        {
            this.tryTransferStickerFromJustCompletedBoxes();
            this.tryTransferStickerFromJustCachedSlots();
        }
    }

    lateUpdate(deltaTime: number): void
    {

    }

    showTransparentBlocks(name: string, isTransparent: boolean): void
    {
        const object = this._holdableMap.get(name);
        if (object)
        {
            object.setMaterialTrans(isTransparent ? this.stickerConfigs.objectTransparentMaterial : null);
        }
    }

    onPickObject(name: string): void
    {
        if (PREVIEW || EDITOR) console.log("Picked object: " + name);
        const sticker = this._stickerMap.get(name);
        if (sticker)
        {
            this.tryPeelSticker(sticker);
            return;
        }
    }

    public async tryPeelSticker(sticker: Sticker): Promise<void>
    {
        if (!sticker.canPeelOff())
        {
            sticker.giveHintBlinking();
            return;
        }
        await sticker.peelOff();
        const targetBox = this.boxController.findSuitableBox(sticker.stickerID);
        if (targetBox)
        {
            this.transferStickerToBox(sticker, targetBox);
            return;
        }
        const pos = new Vec3();
        const cache = this.cacheController.getNextEmptyCache(pos);
        if (cache >= 0)
        {
            this.transferStickerToCache(sticker, pos, cache);
            return;
        }
    }

    public async transferStickerToBox(sticker: Sticker, box: Box): Promise<void>
    {
        const targetNode : Node = box.getEmptySlotNode();
        if (!targetNode) return;

        this._stickerMap.delete(sticker.getName());
        const isBoxFull = box.addSticker(sticker);
        sticker.node.setParent(this.node, true);
        sticker.setNormalMesh(this.stickerConfigs.stickerNormalMesh);
        
        const startPos = sticker.node.getWorldPosition();
        const targetPos = new Vec3();
        const tweenMoveProgress = {x : 0};
        const newPos = new Vec3();
        const rot1 = sticker.node.getWorldRotation();
        const rot2 = Quat.fromEuler(new Quat(), 20, 180, 0);
        const rotLerp = new Quat();

        const scale1 = sticker.node.getScale();
        const scale = new Vec3();

        const t = tween(tweenMoveProgress)
            .to(STICKER.TRANSFER_DURATION, { x: 1 }, {
                easing: easing.cubicInOut,
                onUpdate: (target: { x: number }, ratio: number) =>
                {
                    targetNode.getWorldPosition(targetPos);
                    Vec3.lerp(newPos, startPos, targetPos, target.x);
                    // Thêm chuyển động vòng cung theo hướng z
                    const arcOffset = Math.sin(target.x * Math.PI) * 2;
                    newPos.z += arcOffset;
                    sticker.node.setWorldPosition(newPos);
                    Quat.slerp(rotLerp, rot1, rot2, target.x);
                    sticker.node.setWorldRotation(rotLerp);

                    Vec3.lerp(scale, scale1, STICKER.IN_BOX_SCALE, target.x);
                    sticker.node.setScale(scale);

                    const peel = Math.max (STICKER.PEEL_END_PROGRESS - target.x * 6, 0);
                    sticker.setPeelProgress(peel);
                } })
            .start();
        box.shake(STICKER.TRANSFER_DURATION * 0.96);
        await PromiseDelay.Wait(STICKER.TRANSFER_DURATION + game.deltaTime);
        t.stop();
        sticker.node.setParent(targetNode, true);
        sticker.node.setPosition(Vec3.ZERO);
        sticker.node.setRotationFromEuler(STICKER.IN_BOX_ROTATION);
        if (!isBoxFull) return;
        const nextBoxData = this.getNextBoxData();
        if (!nextBoxData)
        {
            await this.boxController.removeBox(box);
            return;
        }
        await box.replaceBox(nextBoxData);
        this._justCompletedBoxes.add(box);
        this.checkLevelResult();
    }

    public async transferStickerToCache(sticker: Sticker, cachePosition: Vec3, cacheIndex: number): Promise<void>
    {
        this.cacheController.setCache(cacheIndex, sticker.stickerID, sticker);
        sticker.node.setParent(this.node, true);
        sticker.setNormalMesh(this.stickerConfigs.stickerNormalMesh);
        const startPos = sticker.node.getWorldPosition();
        const tweenMoveProgress = {x : 0};
        const newPos = new Vec3();
        const rot1 = sticker.node.getWorldRotation();
        const rot2 = Quat.fromEuler(new Quat(), 20, 180, 0);
        const rotLerp = new Quat();

        const scale1 = sticker.node.getScale();
        const scale = new Vec3();

        const t = tween(tweenMoveProgress)
            .to(STICKER.TRANSFER_DURATION, { x: 1 }, {
                easing: 'cubicInOut',
                onUpdate: (target: { x: number }, ratio: number) =>
                {
                    Vec3.lerp(newPos, startPos, cachePosition, target.x);
                    // Thêm chuyển động vòng cung theo hướng z
                    const arcOffset = Math.sin(target.x * Math.PI) * 2;
                    newPos.z += arcOffset;
                    sticker.node.setWorldPosition(newPos);
                    Quat.slerp(rotLerp, rot1, rot2, target.x);
                    sticker.node.setWorldRotation(rotLerp);

                    Vec3.lerp(scale, scale1, STICKER.IN_CACHE_SCALE, target.x);
                    sticker.node.setScale(scale);

                    const peel = Math.max (STICKER.PEEL_END_PROGRESS - target.x * 6, 0);
                    sticker.setPeelProgress(peel);
                } })
            .start();
        await PromiseDelay.Wait(STICKER.TRANSFER_DURATION + game.deltaTime);
        t.stop();
        this.cacheController.setStickerInPlace(cacheIndex, true);
        this._justCachedSlots.add(cacheIndex);
        this.checkLevelResult();
    }

    getNode(): Node
    {
        return this.node;
    }

    getNextBoxData(): BoxData
    {
        const progress = this._stickerMap.size / this.totalStickerCount;
        const difficulty = this.levelsData[this.levelIndex].evaluateDifficulty(progress);
        return this._gameData.getNewBoxData(difficulty);
    }

    private async transferStickerFromCacheToBox(sticker : Sticker, cacheIndex: number, box: Box): Promise<void>
    {
        const targetNode : Node = box.getEmptySlotNode();

        // Clear cache
        this.cacheController.setCache(cacheIndex, -1, null);
        this.cacheController.setStickerInPlace(cacheIndex, false);

        const isBoxFull = box.addSticker(sticker);
        sticker.node.setParent(this.node, true);
        
        const startPos = sticker.node.getWorldPosition();
        const targetPos = targetNode.getWorldPosition();
        const tweenMoveProgress = {x : 0};
        const newPos = new Vec3();
        const rot1 = sticker.node.getWorldRotation();
        const rot2 = Quat.fromEuler(new Quat(), 20, 180, 0);
        const rotLerp = new Quat();

        const scale1 = sticker.node.getScale();
        const scale = new Vec3();

        const t = tween(tweenMoveProgress)
            .to(STICKER.TRANSFER_DURATION_FROM_CACHE, { x: 1 }, {
                easing: 'cubicInOut',
                onUpdate: (target: { x: number }, ratio: number) =>
                {
                    Vec3.lerp(newPos, startPos, targetPos, target.x);
                    // Thêm chuyển động vòng cung theo hướng z
                    const arcOffset = Math.sin(target.x * Math.PI) * 2;
                    newPos.z += arcOffset;
                    sticker.node.setWorldPosition(newPos);
                    Quat.slerp(rotLerp, rot1, rot2, target.x);
                    sticker.node.setWorldRotation(rotLerp);

                    Vec3.lerp(scale, scale1, STICKER.IN_BOX_SCALE, target.x);
                    sticker.node.setScale(scale);

                    const peel = Math.max (STICKER.PEEL_END_PROGRESS - target.x * 6, 0);
                    sticker.setPeelProgress(peel);
                } })
            .start();
        box.shake(STICKER.TRANSFER_DURATION_FROM_CACHE * 0.96);
        await PromiseDelay.Wait(STICKER.TRANSFER_DURATION_FROM_CACHE + game.deltaTime);
        t.stop();
        sticker.node.setParent(targetNode, true);
        sticker.node.setPosition(Vec3.ZERO);
        sticker.node.setRotationFromEuler(STICKER.IN_BOX_ROTATION);
        if (!isBoxFull) return;
        const nextBoxData = this.getNextBoxData();
        if (!nextBoxData)
        {
            await this.boxController.removeBox(box);
            return;
        }
        await box.replaceBox(nextBoxData);
        this._justCompletedBoxes.add(box);
        this.checkLevelResult();
    }

    private tryTransferStickerFromJustCompletedBoxes(): void
    {
        if (this._justCompletedBoxes.size === 0) return;
        while (this._justCompletedBoxes.size > 0)
        {
            const box = this._justCompletedBoxes.values().next().value;
            this._justCompletedBoxes.delete(box)
            const stickerID = box.getBoxData().stickerID;
            let emptySlotCount = box.getBoxData().getEmptySlotCount();
            while (emptySlotCount > 0)
            {
                const res = this.cacheController.findFirstStickerWithID(stickerID);
                if (!res || !res.sticker) break;
                this.transferStickerFromCacheToBox(res.sticker, res.slotIndex, box);
                --emptySlotCount;
            }
        }
    }

    private tryTransferStickerFromJustCachedSlots(): void
    {
        if (this._justCachedSlots.size === 0) return;

        while (this._justCachedSlots.size > 0)
        {
            const slotIndex = this._justCachedSlots.values().next().value;
            this._justCachedSlots.delete(slotIndex);
            const box = this.boxController.findSuitableBox(this.cacheController.getCachedId(slotIndex));
            if (!box) continue;
            const sticker = this.cacheController.getStickerAt(slotIndex);
            if (!sticker) continue;
            this.transferStickerFromCacheToBox(sticker, slotIndex, box);
        }
    }

    public checklevelWin(): boolean
    {
        if (this._stickerMap.size > 0) return false;
        if (!this.cacheController.isAllEmpty()) return false;
        if (this.boxController.getActiveBoxCount() > 0) return false;
        return true;
    }

    public checkLevelLose(): boolean
    {
        if (!this.cacheController.isAllTaken()) return false;
        if (!this.boxController.isAllBoxesReady()) return false;
        
        const idInBoxes = this.boxController.getAllIDsInBoxes();
        const idInCache = this.cacheController.getAllIDs();
        for (const id of idInCache)
        {
            if (idInBoxes.has(id)) return false;
        }
        return true;
    }

    private checkLevelResult(): void 
    {
        if (this._isLevelFinished) return;

        if (this.checklevelWin())
        {
            this._isLevelFinished = true;
            this.endLevel(true);
            return;
        }

        if (this.checkLevelLose())
        {
            this._isLevelFinished = true;
            this.endLevel(false);
            return;
        }
    }

    private endLevel(isWin: boolean): void
    {
        Tween.stopAll();
        PromiseDelay.CancelAllPromises();
        console.log("Level ended. isWin =", isWin);
        EventDispatcher.dispatch(EventName.EndGame, isWin);
    }

    public isLevelFinished(): boolean
    {
        return this._isLevelFinished;
    }
}


