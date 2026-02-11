import { _decorator, Camera, Component, EventTouch, input, Input, Label, Node, Tween, UITransform, Vec3 } from 'cc';
import { ScreenBase } from './ScreenBase';
import { LevelController } from '../../../controllers/LevelController';
import { PlayableAdsManager } from '../../playable/base-script/PlayableAds/PlayableAdsManager';
import { EventDispatcher } from '../../../designPatterns/observer/EventDispatcher';
import { EventName } from '../../EventName';
import { getUIPosition } from '../../../utils/UIUtils';
import { EGameState } from '../../gameStates/EGameState';
const { ccclass, property } = _decorator;

@ccclass('IdleScreen')
export class IdleScreen extends ScreenBase 
{
    @property(LevelController)
    public levelController: LevelController = null;

    @property(Camera)
    public mainCamera: Camera = null;

    @property(Node)
    public canvasNode: Node = null;

    @property(Node)
    public tutorialHand: Node = null;

    protected onEnable(): void
    {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        this.tutorialHand.active = false;
    }

    onShow(): void
    {
        this.scheduleOnce(() => {
            this.showTutorialHand();
        }, 0.5);
    }

    private showTutorialHand(): void
    {
        this.tutorialHand.active = true;
        const worldPos = this.levelController.getTutorialStickerPosition();
        const uiPos = getUIPosition(worldPos, this.mainCamera, this.canvasNode);
        this.tutorialHand.setPosition(uiPos);
        console.log("UI Pos: " + uiPos.toString());
    }

    private onTouchStart(event: EventTouch): void
    {
        PlayableAdsManager.Instance().ActionFirstClicked();
        EventDispatcher.dispatch(EventName.ChangeGameState, EGameState.Gameplay)
    }

    public onDisable(): void {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    public onHide(): void
    {
        this.tutorialHand.active = false;
    }
}


