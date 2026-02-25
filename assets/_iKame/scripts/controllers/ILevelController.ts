import { Material, Node } from "cc";
import { BoxData } from "../gameplay/data/BoxData";
export interface ILevelController
{
    spawnLevel(): void;
    clearLevel(): void;
    doUpdate(deltaTime: number): void;
    lateUpdate(deltaTime: number): void;
    showTransparentBlocks(name: string, isTransparent: boolean): void;
    onPickObject(name: string): void;
    getNode(): Node;
    getNextBoxData(): BoxData;
    isLevelFinished(): boolean;
    getStickerMaterialByID(id: number): Material;
}


