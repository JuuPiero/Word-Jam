import { _decorator, Component, Node } from 'cc';
import { IBoxController } from './IBoxController';
import { BoxData } from '../gameplay/data/BoxData';
import { Box } from '../gameplay/boxes/Box';
const { ccclass, property } = _decorator;

const BOX_SPACING = 2.2

@ccclass('BoxController')
export class BoxController extends Component implements IBoxController
{
    private _activeBoxes: Box[] = [];
    private _boxDataList: BoxData[] = [];
    @property([ Box ]) public boxes: Box[] = [];
    
    setup(count: number): BoxData[]
    {
        for (let i = 0; i < this.boxes.length; i++)
        {
            const box = this.boxes[i];
            if (i >= count)
            {
                box.node.active = false;
                continue;
            }
            this._activeBoxes.push(box);
        }

        let centerX = 0
        for (let i = 0; i < this._activeBoxes.length; i++)
        {
            centerX += i * BOX_SPACING;
        }
        const offsetX = centerX / this._activeBoxes.length;
        for (let i = 0; i < this._activeBoxes.length; i++)
        {
            this._activeBoxes[i].node.active = true;
            this._activeBoxes[ i ].node.setPosition(i * BOX_SPACING - offsetX, 0, 0);
            
            this._boxDataList.push(this._activeBoxes[i].setup());
        }

        return this._boxDataList;
    }

    public findSuitableBox(stickerID: number): Box
    {
        for (let i = 0; i < this._activeBoxes.length; i++)
        {
            const box = this._activeBoxes[i];
            const boxData = box.getBoxData();
            if (boxData.stickerID === stickerID && !boxData.isFull())
            {
                return box;
            }
        }
        return null;
    }
}


