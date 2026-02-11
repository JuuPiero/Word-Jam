import { _decorator, Component, Node } from 'cc';
import { PromiseDelay } from './PromiseDelay';
const { ccclass, property } = _decorator;


@ccclass('CancelablePromiseDelay')
export class CancelablePromiseDelay extends Component {
    start() {
        this.testAysnc();
    }

    public async testAysnc(): Promise<void>
    {
        console.log('Starting delay...');
        const delay = PromiseDelay.Wait(4);
        await delay.wait();
        
        if (delay.isCancelled()) {
            console.log('Delay was canceled');
        } else {
            console.log('Delay finished');
        }
    }
}


