import { _decorator, easing, Node, Slider, tween, Vec3} from 'cc';
import { GameStateBase } from './GameStateBase';
import { EGameState } from './EGameState';

const INTRO_TIME = 0.25;
export class GameIntroState extends GameStateBase
{
    private _timer: number = 0;
    
    public onEnter(): void
    {
        super.onEnter();
        console.log("Entering GameIntroState");
    }

    public onUpdate(dt: number): void
    {
        this._timer += dt;
        if (this._timer >= INTRO_TIME) {
            this.stateMachine.changeState(EGameState.Idle);
        }
    }

    public onExit(): void
    {
        super.onExit();
        console.log("Exiting GameIntroState");
    }

}


