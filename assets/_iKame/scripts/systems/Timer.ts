import { _decorator, AudioClip, CCInteger, Component, Label, Node } from 'cc';
import { EventDispatcher } from '../designPatterns/observer/EventDispatcher';
import { EventName } from './EventName';
const { ccclass, property } = _decorator;

@ccclass('Timer')
export class Timer extends Component
{
    @property(CCInteger) 
    timeLimit: number = 20;

    private _timeCounter : number = 0;

    @property(Label)
    labelTimer: Label = null!;

    @property(AudioClip) tickSound: AudioClip = null!;
    
    start() 
    {
        EventDispatcher.addListener(EventName.FirstTouch, this.startTimer, this);
        EventDispatcher.addListener(EventName.EndGame, this.onLevelEnd, this);
        EventDispatcher.addListener(EventName.ReplayGame, this.startTimer, this);

        this._timeCounter = this.timeLimit;
        this.updateTimer();
    }

    protected onDestroy(): void
    {
        EventDispatcher.removeListener(EventName.FirstTouch, this.startTimer, this);
        EventDispatcher.removeListener(EventName.EndGame, this.onLevelEnd, this);
        EventDispatcher.removeListener(EventName.ReplayGame, this.startTimer, this);
    }

    startTimer()
    {
        let repeat = this.timeLimit;
        this._timeCounter = this.timeLimit;
        this.schedule(this.updateTimer, 1, repeat, 1);
    }

    updateTimer()
    {
        const minutes = Math.floor(this._timeCounter / 60);
        const seconds = this._timeCounter % 60;
        const mStr =  minutes < 10 ? '0' + minutes : minutes;
        const sStr = seconds < 10 ? '0' + seconds : seconds;
        this.labelTimer.string = `${mStr}:${sStr}`;
        if (this._timeCounter <= 5)
        {
            // EventDispatcher.dispatch(EventName.WarningFlash);
            EventDispatcher.dispatch(EventName.PlaySFX, this.tickSound);
        }
        if (this._timeCounter <= 0)
        {
            EventDispatcher.dispatch(EventName.EndGame, false);
            return;
        }
        this._timeCounter--;
    }

    onLevelEnd()
    {
        this.unschedule(this.updateTimer);
    }
}


