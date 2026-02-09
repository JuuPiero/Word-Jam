import { _decorator, CCInteger, Component, instantiate, Node, Prefab } from 'cc';
import { ILevelController } from './ILevelController';
import { LevelDataSO } from '../configData/LevelDataSO';
import { GameData } from '../gameplay/data/GameData';
const { ccclass, property } = _decorator;

@ccclass('LevelController')
export class LevelController extends Component implements ILevelController
{
    @property([LevelDataSO]) public levelsData: LevelDataSO[] = [];
    @property(CCInteger) public levelIndex: number = 0;

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


