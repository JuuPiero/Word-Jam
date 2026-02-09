export interface ILevelController {
    spawnLevel(): Promise<void>;
    clearLevel(): void;
    doUpdate(deltaTime: number): void;
    lateUpdate(deltaTime: number): void;
}


