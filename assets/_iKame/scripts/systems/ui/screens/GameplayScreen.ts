import { _decorator, Node, Slider } from 'cc';
import { ScreenBase } from './ScreenBase';
import { LevelController } from '../../../controllers/LevelController';
import { LEVEL } from '../../../GameConstants';
const { ccclass, property } = _decorator;

@ccclass('GameplayScreen')
export class GameplayScreen extends ScreenBase
{
    @property(LevelController)
    public levelController: LevelController = null;
    @property(Slider)
    public scaleSlider: Slider = null;

    protected onEnable(): void
    {
        this.scaleSlider.progress = LEVEL.DEFAULT_SCALE;
    }

    public setScale()
    {
        const scale = this.scaleSlider.progress;
        this.levelController.setLevelScale(scale);
    }
}
 

