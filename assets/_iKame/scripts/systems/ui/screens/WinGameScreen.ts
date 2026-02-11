import { _decorator, AudioClip, Component, Node } from 'cc';
import { ScreenBase } from './ScreenBase';
import { PlayableAdsManager } from '../../playable/base-script/PlayableAds/PlayableAdsManager';
import { EventDispatcher } from '../../../designPatterns/observer/EventDispatcher';
import { ETrackingEvent, TrackingManager } from '../../playable/base-script/PlayableAds/Tracking/TrackingManager';
import { EventName } from '../../EventName';

const { ccclass, property } = _decorator;

@ccclass('WinGameScreen')
export class WinGameScreen extends ScreenBase
{

    @property(AudioClip)
    public winSFX: AudioClip = null

    protected onEnable(): void
    {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    protected onDisable(): void
    {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd(): void
    {
        PlayableAdsManager.Instance().ClickOpenStore();
        this.unschedule(this.toStoreAuto);
    }

    onShow(): void
    {
        EventDispatcher.dispatch(EventName.PlaySFX, this.winSFX);
        TrackingManager.TrackEvent(ETrackingEvent.ENDCARD_SHOWN);

        this.scheduleOnce(this.toStoreAuto, 3);
    }

    toStoreAuto(): void
    {
        PlayableAdsManager.Instance().ForceOpenStore();
    }
}


