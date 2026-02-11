import { Component, _decorator, Node, director, game, Game } from "cc";
const { ccclass, property } = _decorator;
interface IPromiseDelay 
{
    // onCancel(cancelablePromise: CancelablePromise): void;
    // onComplete(cancelablePromise: CancelablePromise): void;
}

@ccclass('PromiseDelay')
export class PromiseDelay extends Component implements IPromiseDelay
{
    private static _Instance: PromiseDelay | null = null;

    public static Wait(s: number): Promise<void>
    {
        if (!this._Instance) {
            const node = new Node('PromiseDelay');
            const scene = director.getScene();
            scene.addChild(node);
            this._Instance = node.addComponent(PromiseDelay);
        }
        return new Promise<void>((resolve, reject) =>
        { 
            this._Instance.scheduleOnce(() => {
                resolve();
            }, s);
        });
    }

            
    public static CancelAllPromises(): void
    {
        this._Instance.unscheduleAllCallbacks();
    }

    protected onDestroy(): void
    {
        PromiseDelay._Instance = null;
    }
}

