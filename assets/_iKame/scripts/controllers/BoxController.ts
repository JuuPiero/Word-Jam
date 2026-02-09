import { _decorator, Component, Node } from 'cc';
import { IBoxController } from './IBoxController';
import { BoxData } from '../gameplay/data/BoxData';
const { ccclass, property } = _decorator;

@ccclass('BoxController')
export class BoxController extends Component implements IBoxController {
    
    setup(): BoxData[]
    {
        return [];
    }
}


