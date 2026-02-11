import { _decorator, Component, easing, Label, Node, RichText, tween, Tween, Widget } from 'cc';
import { Headline } from './Headline';
const { ccclass, property } = _decorator;

@ccclass('LevelTag')
export class LevelTag extends Headline {
    
    @property(RichText) levelText: RichText = null;

    public setLevel(index: number): void
    {
        this.levelText.string = "Level " + (index + 1);
    }
}


