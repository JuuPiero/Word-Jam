export interface ILevelController {
    spawnLevel(): void;
    clearLevel(): void;
    doUpdate(deltaTime: number): void;
    lateUpdate(deltaTime: number): void;
    showTransparentBlocks(name: string, isTransparent: boolean): void;
    onPickObject(name: string): void;
}


