import { _decorator, CCInteger, Component, instantiate, Node, Prefab } from 'cc';
import { ILevelController } from './ILevelController';
import { LevelDataSO } from '../configData/LevelDataSO';
import { GameData } from '../gameplay/data/GameData';
import { BoxController } from './BoxController';
import { CacheController } from './CacheController';
const { ccclass, property } = _decorator;

@ccclass('LevelController')
export class LevelController extends Component implements ILevelController
{
    @property([LevelDataSO]) public levelsData: LevelDataSO[] = [];
    @property(CCInteger) public levelIndex: number = 0;

    @property({ type: BoxController, group: "Controllers" }) public boxController: BoxController;
    @property({type: CacheController, group : "Controllers"}) public cacheController: CacheController;
    

    private _gameData: GameData;

    protected start(): void
    {
        this.spawnLevel();
    }

    spawnLevel()
    {
        const levelData = this.levelsData[ this.levelIndex ];
        var levelNode = instantiate(levelData.levelPrefab);
        levelNode.setParent(this.node);
        const boxDatas = this.boxController.setup(levelData.maxBox);
        const cacheData = this.cacheController.setup(levelData.maxCache);
    }

    clearLevel(): void
    {
        this.node.destroyAllChildren();
    }

    doUpdate(deltaTime: number): void
    {

    }

    lateUpdate(deltaTime: number): void
    {

    }
}


