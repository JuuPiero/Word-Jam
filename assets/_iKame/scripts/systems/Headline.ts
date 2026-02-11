import { _decorator, Component, easing, Node, tween, Tween, Vec3, Widget } from 'cc';
import { EventName } from './EventName';
import { EventDispatcher } from '../designPatterns/observer/EventDispatcher';
const { ccclass, property } = _decorator;

@ccclass('Headline')
export class Headline extends Component {

    @property(Widget) private widget: Widget = null;

    start() {
        EventDispatcher.addListener(EventName.EndGame, this.hide, this);
    }

    protected onDestroy(): void
    {
        EventDispatcher.removeListener(EventName.EndGame, this.hide, this);
    }

    update(deltaTime: number) {
        
    }

    public hide(): void 
    {
        Tween.stopAllByTarget(this.widget);
        tween(this.widget)
            .to(0.5, { top: -364 }, { easing: easing.sineOut })
            .start();
    }

    public show(): void 
    {
        Tween.stopAllByTarget(this.widget);
        tween(this.widget)
            .to(0.5, { top: 0 }, { easing: easing.sineOut })
            .start();
    }
}


