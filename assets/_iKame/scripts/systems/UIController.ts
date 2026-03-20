import { _decorator, Camera, Component, game, Node, ResolutionPolicy, UITransform, view } from 'cc';
import { IdleScreen } from './ui/screens/IdleScreen';
import { GameplayScreen } from './ui/screens/GameplayScreen';
import { EndGameScreen } from './ui/screens/EndGameScreen';
import { WinGameScreen } from './ui/screens/WinGameScreen';
import { EmptyScreen } from './ui/screens/EmptyScreen';
import { TransitionScreen } from './ui/screens/TransitionScreen';
import { ScreenBase } from './ui/screens/ScreenBase';
import { EventName } from './EventName';
import { EventDispatcher } from '../designPatterns/observer/EventDispatcher';
import { Stack } from '../commond/Stack';
import { EGameState } from './gameStates/EGameState';
import { PromiseDelay } from '../utils/PromiseDelay';
import { IntroScreen } from './ui/screens/IntroScreen';

const SQUARE_RATIO = 3/4 // 4:3 ratio

const { ccclass, property } = _decorator;

// const FADE_DURATION = 0.2;

@ccclass('UIController')
export class UIController extends Component {

    @property(IdleScreen)
    public idleScreen: IdleScreen = null;
    
    @property(GameplayScreen)
    public gameplayScreen: GameplayScreen = null;

    @property(EndGameScreen)
    public endGame: EndGameScreen = null;

    @property(WinGameScreen)
    public winGameScreen: WinGameScreen = null;

    @property(EmptyScreen)
    public emptyScreen: EmptyScreen = null;

    @property(TransitionScreen)
    public transitionScreen: TransitionScreen = null;

    @property(IntroScreen)
    public introScreen: IntroScreen = null;

    private stackStates: Stack<ScreenBase> = new Stack<ScreenBase>();

    public activeScreen: ScreenBase = null;

    private _uiTransform: UITransform;
    
    protected onLoad(): void {
        EventDispatcher.addListener(EventName.ShowScreen, this.onShowScreen, this);
        EventDispatcher.addListener(EventName.BackScreen, this.onBackScreen, this);
        EventDispatcher.addListener(EventName.ToggleVideo, this.onToggleVideo, this);
    }

    private onToggleVideo()
    {
        const uiCamera = this.node.getComponentInChildren(Camera);
        uiCamera.enabled = !uiCamera.enabled;
    }

    protected onDestroy(): void {
        EventDispatcher.removeListener(EventName.ShowScreen, this.onShowScreen, this);
        EventDispatcher.removeListener(EventName.BackScreen, this.onBackScreen, this);
        EventDispatcher.removeListener(EventName.ToggleVideo, this.onToggleVideo, this);

        window.removeEventListener('resize', this.onResize.bind(this))
        window.removeEventListener('orientationchange', this.onResize.bind(this))
    }

    protected start(): void
    {
        this.onResize();
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('orientationchange', this.onResize.bind(this))
    }

    public async showScreen(screen: ScreenBase): Promise<void>
    {
        if (this.activeScreen == screen)
            return;
        this.activeScreen = screen;
        for (let i = 0; i < this.stackStates.size(); i++)
        {
            const scr = this.stackStates.get(i);
            await scr.hide();
        }
        this.stackStates.push(screen);
        await screen.show();
    }

    public async backState(): Promise<void>
    {
        if (this.stackStates.size() <= 0)
            return;
        const lastScreen = this.stackStates.pop();
        this.activeScreen = this.stackStates.peek();
        await lastScreen.hide();
        this.activeScreen.show();
    }

    public onShowScreen(stateName: EGameState)
    {
        // const stateName = args[0] as EGameState;
        switch (stateName) {
            case EGameState.Gameplay:
                this.showScreen(this.gameplayScreen);
                break;
            case EGameState.Win:
                this.showScreen(this.winGameScreen);
                break;
            case EGameState.Paused:
                this.showScreen(this.emptyScreen);
                break;
            case EGameState.Lose:
                this.showScreen(this.endGame);
                break;
            case EGameState.Idle:
                this.showScreen(this.idleScreen);
                break;
            case EGameState.Start:
                this.showScreen(this.emptyScreen);
                break;
            case EGameState.Transition:
                this.showScreen(this.transitionScreen);
                break;
            case EGameState.Intro:
                this.showScreen(this.introScreen);
                break;
            default:
                break;
        }
    }

    public onBackScreen()
    {
        this.backState();
    }

    public onResize()
    {
        if (!this._uiTransform) this._uiTransform = this.node.getComponent(UITransform); 
        const ratio = this._uiTransform.contentSize.width / this._uiTransform.contentSize.height;
        if (ratio > SQUARE_RATIO)
        {
            view.setDesignResolutionSize(1080, 1920, ResolutionPolicy.FIXED_HEIGHT);
            return;
        }
        view.setDesignResolutionSize(1080, 1920, ResolutionPolicy.FIXED_WIDTH);
    }
}


