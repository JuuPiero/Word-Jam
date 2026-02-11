import { Input, input } from "cc";
import { GameStateBase } from "./GameStateBase";
import { PlayableAdsManager } from "../../base-script/PlayableAds/PlayableAdsManager";
import { PromiseDelay } from "../../common/PromiseDelay";
import { CameraPanZoom } from "../../common/CameraPanZoom";


export class WinState extends GameStateBase
{
    public onEnter(): void {
        super.onEnter();
        // CameraPanZoom.Instance.resetCamera();
    }
}


