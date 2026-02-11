import { _decorator, easing, Node, Slider, tween, Vec3} from 'cc';
import { GameStateBase } from './GameStateBase';
import { EGameState } from './EGameState';
import { IChangeState } from '../../designPatterns/stateMachine/BaseStateMachine';

export class GameIntroState extends GameStateBase
{
    public onEnter(): void
    {
        super.onEnter();    
        this.playIntroAsync();
    }

    private async playIntroAsync()
    {
        this.stateMachine.changeState(EGameState.Idle);
    }
}


