import { _decorator, Camera, Component, EventKeyboard, Input, input, KeyCode, Node, Slider, sys } from 'cc';
import { EGameState } from './gameStates/EGameState';
import { GameStateMachine } from './gameStates/GameStateMachine';
import { GameInitializingState } from './gameStates/GameInitializingState';
import { GameStartState } from './gameStates/GameStartState';
import { GameIdleState } from './gameStates/GameIdleState';
import { GameplayState } from './gameStates/GameplayState';
import { PauseState } from './gameStates/PauseState';
import { GameOverState } from './gameStates/GameOverState';
import { WinState } from './gameStates/WinState';
import { GameStateBase } from './gameStates/GameStateBase';
import { GameTransitionState } from './gameStates/GameTransitionState';
import { GameIntroState } from './gameStates/GameIntroState';
import { IStateHolder } from '../designPatterns/stateMachine/BaseStateMachine';
import { LevelController } from '../controllers/LevelController';
import { ETrackingEvent, TrackingManager } from './playable/base-script/PlayableAds/Tracking/TrackingManager';
import { EventDispatcher } from '../designPatterns/observer/EventDispatcher';
import { EventName } from './EventName';

const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component implements IStateHolder<EGameState>
{
    stateMachine: GameStateMachine;

    initializingState: GameInitializingState;
    gameStartState: GameStartState;
    idleState: GameIdleState;
    introState: GameIntroState;
    gameplayState: GameplayState;
    pauseState: PauseState;
    gameOverState: GameOverState;
    winGameState: WinState;
    transitionState: GameTransitionState;

    @property(LevelController)
    public levelController: LevelController;
    
    protected onLoad(): void
    {
        EventDispatcher.addListener(EventName.EndGame, this.onEndGame, this);
        EventDispatcher.addListener(EventName.ReplayGame, this.onReplayGame, this);
        EventDispatcher.addListener(EventName.ChangeGameState, this.changeState, this);

        if (sys.os == sys.OS.WINDOWS)
        {
            input.on(Input.EventType.KEY_DOWN, this.onPressButton, this);
        }
    }

    start()
    {        
        this.stateMachine = new GameStateMachine(this);
        this.initializingState = new GameInitializingState(EGameState.Initializing, this.stateMachine, this.levelController);
        this.gameStartState = new GameStartState(EGameState.Start, this.stateMachine, this.levelController);
        this.idleState = new GameIdleState(EGameState.Idle, this.stateMachine);
        this.introState = new GameIntroState(EGameState.Intro, this.stateMachine);
        this.gameplayState = new GameplayState(EGameState.Gameplay, this.stateMachine, this.levelController);
        this.pauseState = new PauseState(EGameState.Paused, this.stateMachine);
        this.gameOverState = new GameOverState(EGameState.Lose, this.stateMachine);
        this.winGameState = new WinState(EGameState.Win, this.stateMachine);
        this.transitionState = new GameTransitionState(EGameState.Transition, this.stateMachine);
        const map = new Map<EGameState, GameStateBase>();
        map.set(EGameState.Initializing, this.initializingState);
        map.set(EGameState.Idle, this.idleState);
        map.set(EGameState.Intro, this.introState);
        map.set(EGameState.Start, this.gameStartState);
        map.set(EGameState.Gameplay, this.gameplayState);
        map.set(EGameState.Paused, this.pauseState);
        map.set(EGameState.Lose, this.gameOverState);
        map.set(EGameState.Win, this.winGameState);
        map.set(EGameState.Transition, this.transitionState);
        this.stateMachine.init(EGameState.Initializing, map);
        TrackingManager.TrackEvent(ETrackingEvent.DISPLAYED);
    }

    private onEndGame(isWin: boolean, isLastLevel: boolean): void
    {
        if (isWin) 
        {
            if (!isLastLevel)
            {
                this.stateMachine.changeState(EGameState.Transition);
                return;
            }

            this.stateMachine.changeState(EGameState.Win);
            return;
        }
        this.stateMachine.changeState(EGameState.Lose);
    }

    onChangeState(state: EGameState): void
    {
    }

    private onReplayGame(): void
    {
        this.stateMachine.changeState(EGameState.Start);
    }

    protected onDestroy(): void
    {
        EventDispatcher.removeListener(EventName.EndGame, this.onEndGame, this);
        EventDispatcher.removeListener(EventName.ReplayGame, this.onReplayGame, this);
        EventDispatcher.removeListener(EventName.ChangeGameState, this.changeState, this);

        if (sys.os == sys.OS.WINDOWS)
        {
            input.off(Input.EventType.KEY_DOWN, this.onPressButton, this);
        }
    }

    protected update(dt: number): void
    {
        this.stateMachine.update(dt);
    }

    protected lateUpdate(dt: number): void
    {
        this.stateMachine.lateUpdate(dt);
    }

    public getCurrentState(): EGameState
    {
        return this.stateMachine.currentState.name;
    }

    public changeState(stateName: EGameState): void
    {
        this.stateMachine.changeState(stateName);
    }

    private onPressButton(eventKeyboard: EventKeyboard)
    {
        if (eventKeyboard.keyCode == KeyCode.F12)
        {
            EventDispatcher.dispatch(EventName.ToggleVideo);
        }
    }
}


