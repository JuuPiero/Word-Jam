import { _decorator, AudioClip, CCInteger, Component, easing, game, instantiate, Label, Material, math, Node, Prefab, Quat, Tween, tween, Vec3 } from 'cc';
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
import { EMPTY_LETTER, LEVEL, STICKER } from '../GameConstants';
import { BoxData } from '../gameplay/data/BoxData';
import { EventDispatcher } from '../designPatterns/observer/EventDispatcher';
import { EventName } from '../systems/EventName';
import { ETrackingEvent, TrackingManager } from '../systems/playable/base-script/PlayableAds/Tracking/TrackingManager';
import { DragRotateController } from '../commond/DragRotateController';
import { LetterDataSO } from '../configData/LetterDataSO';
const { ccclass, property } = _decorator;

const FRAME_SKIP = 5;

@ccclass('LevelController')
export class LevelController extends Component implements ILevelController
{

    @property([LevelDataSO]) public levelsData: LevelDataSO[] = [];
    @property(CCInteger) public levelIndex: number = 0;

    @property({ type: BoxController, group: "Controllers" }) public boxController: BoxController;
    @property({ type: CacheController, group: "Controllers" }) public cacheController: CacheController;
    @property({type: DragRotateController, group : "Controllers"}) public rotateController: DragRotateController;
    @property(BlockPicker) public blockPicker: BlockPicker;
    @property({ type: StickerConfigs, group: "ConfigData" }) public stickerConfigs: StickerConfigs;
    @property({ type: AudioClip, group: "Audio" }) public stickerPeelSound: AudioClip = null;
    @property({ type: AudioClip, group: "Audio" }) public stickerPlaceInBoxSound: AudioClip = null;
    @property({ type: AudioClip, group: "Audio" }) public stickerFlySound: AudioClip = null;
    @property({ type: AudioClip, group: "Audio" }) public errorClickSound: AudioClip = null;


    private _gameData: GameData;

    private _stickerMap: Map<string, Sticker> = new Map<string, Sticker>();
    private _holdableMap: Map<string, HoldableObject> = new Map<string, HoldableObject>();

    private _justCompletedBoxes: Set<Box> = new Set<Box>();
    private _justCachedSlots: Set<number> = new Set<number>();

    @property(Node) private rotationRoot: Node;

    private _isLevelFinished: boolean = false;

    private totalStickerCount: number = 0;

    private _is25Complete: boolean = false;
    private _is50Complete: boolean = false;
    private _is75Complete: boolean = false;

    @property(Label) private stickerCountLabel: Label;

    protected onLoad(): void
    {
        this.blockPicker.levelController = this;
    }

    spawnLevel()
    {
        const levelData = this.levelsData[ this.levelIndex ];
        levelData.init();
        var levelNode = instantiate(levelData.levelPrefab);
        levelNode.setParent(this.rotationRoot, false);
        this.rotateController.allowAutoRotate = false;
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
        let letters: string[] = levelData.getAllLetters();
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
            const letter = letters ? letters[stickerDatas.length] : '';
            const stickerData = sticker.setup(this, blockingStickers, holdingObjects, weightLockStickers, weightLockObjects, letter);
            stickerDatas.push(stickerData);
        }

        this.boxController.setup(levelData.maxBox, this);
        const cacheData = this.cacheController.setup(levelData.maxCache);
        const boxDatas = this.boxController.getBoxesDataList();
        this._gameData = new GameData(this.levelIndex, boxDatas, cacheData, stickerDatas, holdableDatas, levelData.getTargetWords());
        this.boxController.setupFirstBoxes();

        this.totalStickerCount = stickerDatas.length;

        this._isLevelFinished = false;

        this.setLevelScale(LEVEL.DEFAULT_SCALE);
        this.rotationRoot.setRotationFromEuler(Vec3.ZERO);

        TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_STARTED);

        this._is25Complete = false;
        this._is50Complete = false;
        this._is75Complete = false;

        this.stickerCountLabel.string = `00/${this.totalStickerCount}`;
    }
    public getStickersLeft() {
        return this._stickerMap.values
    }

    clearLevel(): void
    {
        this.boxController.clear();
        this.cacheController.clear();
        for (const [ k, v ] of this._holdableMap)
        {
            v.destroyObject();
        }
        this._holdableMap.clear();
        this._stickerMap.clear();
        this._justCompletedBoxes.clear();
        this._justCachedSlots.clear();
        this.rotationRoot.destroyAllChildren();
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
        if (!sticker.isNotBlocked())
        {
            sticker.giveHintBlinking();
            EventDispatcher.dispatch(EventName.PlaySFX, this.errorClickSound);
            return;
        }
        const targetBox = this.boxController.findSuitableBox(sticker.letter);
        const targetNode = targetBox ? targetBox.getEmptySlotNode(sticker.letter) : null;
        // if (!targetBox || !targetNode)
        // {
        //     sticker.selfBlinking();
        //     EventDispatcher.dispatch(EventName.PlaySFX, this.errorClickSound);
        //     return;
        // }
        this._stickerMap.delete(sticker.getName());
        this._gameData.removeStickerData(sticker.getData());
        EventDispatcher.dispatch(EventName.PlaySFX, this.stickerPeelSound);
        this.trackingLevelProgress();
        await sticker.peelOff();
        if (targetBox && targetNode)
        {
            this.transferStickerToBox(sticker, targetBox, targetNode);
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

    public async transferStickerToBox(sticker: Sticker, box: Box, targetNode: Node): Promise<void>
    {
        const isBoxFull = box.addSticker(sticker);
        sticker.node.setParent(this.node, true);
        //sticker.setNormalMesh(this.stickerConfigs.stickerNormalMesh);
        EventDispatcher.dispatch(EventName.PlaySFX, this.stickerFlySound, .34);
        const startPos = sticker.node.getWorldPosition();
        const targetPos = new Vec3();
        const tweenMoveProgress = {x : 0};
        const newPos = new Vec3();
        const rot1 = sticker.node.getWorldRotation();
        const rot2 = targetNode.getWorldRotation();
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
                } })
            .start();
        box.shake(STICKER.TRANSFER_DURATION * 0.96);
        await PromiseDelay.Wait(STICKER.TRANSFER_DURATION + game.deltaTime);
        t.stop();
        sticker.node.setParent(targetNode, true);
        sticker.node.setPosition(Vec3.ZERO);
        sticker.node.setRotationFromEuler(STICKER.IN_BOX_ROTATION);
        box.updateVisibleSlot();
        EventDispatcher.dispatch(EventName.PlaySFX, this.stickerPlaceInBoxSound, .34);

        if (!isBoxFull) return;
        box.resetData(EMPTY_LETTER);
        const nextBoxData = this.getNextBoxData();
        if (!nextBoxData)
        {
            await this.boxController.removeBox(box);
            this.checkLevelResult();
            return;
        }
        await box.replaceBox(nextBoxData);
        this._justCompletedBoxes.add(box);
    
           
        console.log(this.getStickersLeft().length);
    
    }

    public async transferStickerToCache(sticker: Sticker, cachePosition: Vec3, cacheIndex: number): Promise<void>
    {
        this.cacheController.setCache(cacheIndex, sticker.letter, sticker);
        sticker.node.setParent(this.node, true);
        //sticker.setNormalMesh(this.stickerConfigs.stickerNormalMesh);
        const startCenter = new Vec3();
        if (!sticker.tryGetWorldBoundsCenter(startCenter)) {
            sticker.node.getWorldPosition(startCenter);
        }
        const tweenMoveProgress = {x : 0};
        const targetCenter = new Vec3();
        const rot1 = sticker.node.getWorldRotation();
        const rot2 = Quat.fromEuler(new Quat(), -67.92, 180, 0);
        const rotLerp = new Quat();

        const scale1 = sticker.node.getScale();
        const scale = new Vec3();
        EventDispatcher.dispatch(EventName.PlaySFX, this.stickerFlySound , .34);
        const t = tween(tweenMoveProgress)
            .to(STICKER.TRANSFER_DURATION, { x: 1 }, {
                easing: 'cubicInOut',
                onUpdate: (target: { x: number }, ratio: number) =>
                {
                    Quat.slerp(rotLerp, rot1, rot2, target.x);
                    sticker.node.setWorldRotation(rotLerp);

                    Vec3.lerp(scale, scale1, STICKER.IN_CACHE_SCALE, target.x);
                    sticker.node.setScale(scale);

                    // Move by *visual center* (renderer bounds center), not by node pivot.
                    Vec3.lerp(targetCenter, startCenter, cachePosition, target.x);
                    const arcOffset = Math.sin(target.x * Math.PI) * 2;
                    targetCenter.z += arcOffset;
                    sticker.setWorldBoundsCenter(targetCenter);
                } })
            .start();
        await PromiseDelay.Wait(STICKER.TRANSFER_DURATION + game.deltaTime);
        t.stop();
        // Final snap: ensure the center is exactly at the cache position.
        sticker.setWorldBoundsCenter(cachePosition);
        this.cacheController.setStickerInPlace(cacheIndex, true);
        // EventDispatcher.dispatch(EventName.PlaySFX, this.stickerPlaceInBoxSound, .34);
        this._justCachedSlots.add(cacheIndex);
        this.checkLevelResult();
    }

    getNode(): Node
    {
        return this.node;
    }

    getNextBoxData(): BoxData
    {
        console.log("stickers left: " + this._stickerMap.size);
        
        const progress = 1 - (this._stickerMap.size / this.totalStickerCount);
        const difficulty = this.levelsData[this.levelIndex].evaluateDifficulty(progress);
        return this._gameData.getNewBoxData(difficulty);
    }

    private async transferStickerFromCacheToBox(sticker : Sticker, cacheIndex: number, box: Box): Promise<void>
    {
        const targetNode : Node = box.getEmptySlotNode(sticker.letter);

        // Clear cache
        this.cacheController.setCache(cacheIndex, EMPTY_LETTER, null);
        this.cacheController.setStickerInPlace(cacheIndex, false);

        const isBoxFull = box.addSticker(sticker);
        sticker.node.setParent(this.node, true);
        EventDispatcher.dispatch(EventName.PlaySFX, this.stickerFlySound , .34);
        const startPos = sticker.node.getWorldPosition();
        const targetPos = targetNode.getWorldPosition();
        const tweenMoveProgress = {x : 0};
        const newPos = new Vec3();
        const rot1 = sticker.node.getWorldRotation();
        const rot2 = targetNode.getWorldRotation();
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
                } })
            .start();
        box.shake(STICKER.TRANSFER_DURATION_FROM_CACHE * 0.96);
        await PromiseDelay.Wait(STICKER.TRANSFER_DURATION_FROM_CACHE + game.deltaTime);
        t.stop();
        sticker.node.setParent(targetNode, true);
        sticker.node.setPosition(Vec3.ZERO);
        sticker.node.setRotationFromEuler(STICKER.IN_BOX_ROTATION);
        box.updateVisibleSlot();
        EventDispatcher.dispatch(EventName.PlaySFX, this.stickerPlaceInBoxSound, .34);

        if (!isBoxFull) return;
        box.resetData(EMPTY_LETTER);
        const nextBoxData = this.getNextBoxData();
        if (!nextBoxData)
        {
            await this.boxController.removeBox(box);
            this.checkLevelResult();
            return;
        }
        await box.replaceBox(nextBoxData);
        this._justCompletedBoxes.add(box);

        console.log(this.getStickersLeft().length);

    }

    private tryTransferStickerFromJustCompletedBoxes(): void
    {
        if (this._justCompletedBoxes.size === 0) return;
        while (this._justCompletedBoxes.size > 0)
        {
            const box = this._justCompletedBoxes.values().next().value as Box;
            this._justCompletedBoxes.delete(box)
            const letters = box.getBoxData().getRemainingLetters();
            while (letters.length > 0)
            {
                const letter = letters.shift();
                const res = this.cacheController.findFirstStickerWithLetter(letter);
                if (!res || !res.sticker) continue;
                this.transferStickerFromCacheToBox(res.sticker, res.slotIndex, box);
            }
        }
    }

    private tryTransferStickerFromJustCachedSlots(): void
    {
        if (this._justCachedSlots.size === 0) return;

        while (this._justCachedSlots.size > 0)
        {
            const slotIndex = this._justCachedSlots.values().next().value as number;
            this._justCachedSlots.delete(slotIndex);
            const box = this.boxController.findSuitableBox(this.cacheController.getCachedLetter(slotIndex));
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
        
        const idInBoxes = this.boxController.getAllEmptyLettersInBoxes();
        const idInCache = this.cacheController.getAllLetters();
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
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_SOLVED);
            this._isLevelFinished = true;
            this.endLevel(true);
            return;
        }

        if (this.checkLevelLose())
        {
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_FAILED);
            this._isLevelFinished = true;
            this.endLevel(false);
            return;
        }
    }

    private endLevel(isWin: boolean): void
    {
        PromiseDelay.CancelAllPromises();
        this.levelIndex += isWin ? 1 : 0;
        const isLastLevel = this.levelIndex >= this.levelsData.length;
        EventDispatcher.dispatch(EventName.EndGame, isWin, isLastLevel);
    }

    public isLevelFinished(): boolean
    {
        return this._isLevelFinished;
    }

    public getTutorialStickerPosition(): Vec3
    {
        const sticker = this._stickerMap.get(this.levelsData[ this.levelIndex ].stickerTutName);
        if (sticker)
        {
            return sticker.node.getWorldPosition();
        }
        return Vec3.ZERO;
    }

    private _levelScale : Vec3 = new Vec3(1,1,1);
    public setLevelScale(progress: number): void
    {
        let s: number = math.lerp(LEVEL.MIN_SCALE, LEVEL.MAX_SCALE, progress);
        this._levelScale.set(s, s, s);
        this.rotationRoot.setScale(this._levelScale);
    }

    public trackingLevelProgress(): void 
    {
        const progress = 1 - this._stickerMap.size / this.totalStickerCount;
        const score = this.totalStickerCount - this._stickerMap.size
        this.stickerCountLabel.string = (score < 10) ?  `0${score}/${this.totalStickerCount}` : `${score}/${this.totalStickerCount}`;
        if (!this._is25Complete && progress >= 0.25)
        {
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_PASS_25);
            this._is25Complete = true;
        }
        if (!this._is50Complete && progress >= 0.5)
        {
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_PASS_50);
            this._is50Complete = true;
        }
        if (!this._is75Complete && progress >= 0.75)
        {
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_PASS_75);
            this._is75Complete = true;
        }
    }

    public getLetterMaterial(letter: string): Material
    {
        return this.stickerConfigs.getLetterColor(letter);
    }

    public getLetterData(letter: string): LetterDataSO
    {
        return this.stickerConfigs.getLetterDataByLetter(letter);
    }
}


