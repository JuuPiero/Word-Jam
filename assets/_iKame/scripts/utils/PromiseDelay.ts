import { Component, _decorator, Node, director, game, Game } from "cc";
import { PREVIEW } from "cc/env";
const { ccclass, property } = _decorator;

class CancelablePromise
{
    public readonly _promise: Promise<void>;
    private _id: number | null = null;
    private _resolve: (() => void) | null = null;
    private _isPaused: boolean = false;
    private _isCancelled: boolean = false;
    private _remainingTime: number = 0;
    private _startTime: number = 0;

    public promiseDelay: IPromiseDelay;

    constructor(s: number, promiseDelay: IPromiseDelay)
    {
        this.promiseDelay = promiseDelay;
        this._remainingTime = s * 1000;
        
        this._promise = new Promise((resolve) =>
        {
            this._resolve = resolve;
            this._start();
        });
    }

    private _start(): void
    {
        this._startTime = Date.now();
        this._id = setTimeout(() => {
            if (this._resolve) {
                this._resolve();
                this._resolve = null;
                this.promiseDelay.onComplete(this);
            }
        }, this._remainingTime);
    }

    public pause(): void
    {
        if (this._isPaused || this._id === null) return;
        
        this._isPaused = true;
        const elapsed = Date.now() - this._startTime;
        this._remainingTime = Math.max(0, this._remainingTime - elapsed);
        
        clearTimeout(this._id);
        this._id = null;
    }

    public resume(): void
    {
        if (!this._isPaused) return;
        
        this._isPaused = false;
        this._start();
    }

    public cancel(): void
    {
        if (this._isCancelled) return;
        
        this._isCancelled = true;
        
        if (this._id !== null) {
            clearTimeout(this._id);
            this._id = null;
        }
        
        if (this._resolve) {
            this._resolve();
            this._resolve = null;
        }
        
        this.promiseDelay.onCancel(this);
    }

    public isCancelled(): boolean
    {
        return this._isCancelled;
    }

    public isPaused(): boolean
    {
        return this._isPaused;
    }

    public wait(): Promise<void>
    {
        return this._promise;
    }
}

interface IPromiseDelay 
{
    onCancel(cancelablePromise: CancelablePromise): void;
    onComplete(cancelablePromise: CancelablePromise): void;
}

@ccclass('PromiseDelay')
export class PromiseDelay extends Component implements IPromiseDelay
{
    private static _ActivePromises: Set<CancelablePromise> = new Set<CancelablePromise>();
    private static _Instance: PromiseDelay | null = null;

    public static GetCancelablePromise(s: number): CancelablePromise
    {
        if (!this._Instance) {
            const node = new Node('PromiseDelayNode');
            const scene = director.getScene();
            scene.addChild(node);
            this._Instance = node.addComponent(PromiseDelay);
        }
        const promise = new CancelablePromise(s, this._Instance);
        this._ActivePromises.add(promise);
        return promise;
    }

    onCancel(cancelablePromise: CancelablePromise): void
    {
        PromiseDelay._ActivePromises.delete(cancelablePromise);
    }

    onComplete(cancelablePromise: CancelablePromise): void
    {
        PromiseDelay._ActivePromises.delete(cancelablePromise);
    }

    protected onLoad(): void
    {
        game.on(Game.EVENT_PAUSE, this.onAppPause, this);
        game.on(Game.EVENT_RESUME, this.onAppResume, this);
    }

    private onAppPause()
    {
        if (PREVIEW)
        {
            console.log('App paused, pausing active promises.');
        }
        PromiseDelay._ActivePromises.forEach((p) => {
            p.pause();
        });
    }

    private onAppResume()
    {
        if (PREVIEW)
        {
            console.log('App resumed, resuming active promises.');
        }
        PromiseDelay._ActivePromises.forEach((p) => {
            p.resume();
        });
    }
            
    public static CancelAllPromises(): void
    {
        PromiseDelay._ActivePromises.forEach((p) => p.cancel());
    }

    protected onDestroy(): void
    {
        PromiseDelay._ActivePromises.forEach((p) => p.cancel());
    
        game.off(Game.EVENT_PAUSE, this.onAppPause, this);
        game.off(Game.EVENT_RESUME, this.onAppResume, this);
    }
}

