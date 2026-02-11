import { _decorator, CCBoolean, Component, Node, Tween, tween, UIOpacity } from 'cc';
import { PromiseDelay } from '../../../utils/PromiseDelay';
import { PlayableAdsManager } from '../../playable/base-script/PlayableAds/PlayableAdsManager';
const { ccclass, property } = _decorator;

export const FADE_DURATION: number = 0.12;

@ccclass('ScreenBase')
export abstract class ScreenBase extends Component {
    
    @property(UIOpacity)
    opacity: UIOpacity = null;

    public async show() : Promise<void>
    {
        if (this.node.active)
            return;
        this.node.active = true;
        Tween.stopAllByTarget(this.opacity);
        this.opacity.opacity = 0;
        tween(this.opacity).to(FADE_DURATION, { opacity: 255 }).start();
        await PromiseDelay.Wait(FADE_DURATION);
        this.onShow();
    }

    public async hide() : Promise<void>
    {
        if (!this.node.active)
            return;
        Tween.stopAllByTarget(this.opacity);
        this.opacity.opacity = 255;
        tween(this.opacity).to(FADE_DURATION, { opacity: 0 }).start();
        await PromiseDelay.Wait(FADE_DURATION);
        this.node.active = false;
        this.onHide();
    }

    onShow(): void
    {

    }
    
    onHide(): void
    {

    }

    clickToStore(): void
    {
        PlayableAdsManager.Instance().ButtonOpenStore();
    }
}


