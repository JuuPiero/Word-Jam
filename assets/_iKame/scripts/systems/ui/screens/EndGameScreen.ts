import { _decorator, AudioClip, Node } from 'cc';
import { ScreenBase } from './ScreenBase';
import { ALLOW_REPLAY } from '../../../GameConstants';
import { EventDispatcher } from '../../../designPatterns/observer/EventDispatcher';
import { ETrackingEvent, TrackingManager } from '../../playable/base-script/PlayableAds/Tracking/TrackingManager';
import { EventName } from '../../EventName';
import { PlayableAdsManager } from '../../playable/base-script/PlayableAds/PlayableAdsManager';

const { ccclass, property } = _decorator;

@ccclass('EndGameScreen')
export class EndGameScreen extends ScreenBase {

    @property(AudioClip)
    public lostSFX: AudioClip = null

    @property(Node)
    playnowButton: Node = null;

    @property(Node)
    replayButton: Node = null;

    @property([ Node ])
    public toggleNodes: Node[] = [];

    onShow(): void 
    {
        EventDispatcher.dispatch(EventName.PlaySFX, this.lostSFX);
        TrackingManager.TrackEvent(ETrackingEvent.ENDCARD_SHOWN);    

        this.scheduleOnce(this.toStoreForce, 5);
    }

    replayGame(): void 
    {
        PlayableAdsManager.Instance().ButtonOpenStore();
        this.unschedule(this.toStoreForce);
        EventDispatcher.dispatch(EventName.ReplayGame);
    }

    protected onEnable(): void
    {
        if (!ALLOW_REPLAY) {
            this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        }
        
        this.replayButton.active = ALLOW_REPLAY;
        this.playnowButton.active = !ALLOW_REPLAY;

        this.toggleNodes.forEach( (node) => {
            node.active = !ALLOW_REPLAY;
        } );
    }

    protected onDisable(): void
    {
        if (!ALLOW_REPLAY)
            this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd(): void
    {
        PlayableAdsManager.Instance().ClickOpenStore();
    }

    private toStoreForce(): void
    {
        PlayableAdsManager.Instance().ForceOpenStore();
    }
}


