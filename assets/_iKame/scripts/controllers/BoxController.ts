import { _decorator, AudioClip, Component, Node, Tween, tween, Vec3 } from 'cc';
import { IBoxController } from './IBoxController';
import { BoxData } from '../gameplay/data/BoxData';
import { Box } from '../gameplay/boxes/Box';
import { ILevelController } from './ILevelController';
const { ccclass, property } = _decorator;

const BOX_SPACING = 4.2

@ccclass('BoxController')
export class BoxController extends Component implements IBoxController
{
    private _activeBoxes: Box[] = [];
    private _boxDataList: BoxData[] = [];
    @property([ Box ]) public boxes: Box[] = [];
    private _levelController: ILevelController;


    clear(): void 
    {
        this._activeBoxes = [];
        this._boxDataList = [];
    }
    
    setup(count: number, level: ILevelController)
    {
        this._levelController = level;
        for (let i = 0; i < this.boxes.length; i++)
        {
            const box = this.boxes[ i ];
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
            this._activeBoxes[ i ].node.active = true;
            this._activeBoxes[ i ].node.setPosition(i * BOX_SPACING - offsetX, 0, 0);
            
        }
    }

    setupFirstBoxes(): BoxData[]
    {
        for (let i = 0; i < this._activeBoxes.length; i++)
        {
            const box = this._activeBoxes[ i ];
            const boxData = this._levelController.getNextBoxData();
            this._boxDataList.push(box.setup(this, boxData));
        }
        return this._boxDataList;
    }

    public getBoxesDataList(): BoxData[]
    {
        return this._boxDataList;
    }

    public findSuitableBox(letter: string): Box
    {
        for (let i = 0; i < this._activeBoxes.length; i++)
        {
            const box = this._activeBoxes[ i ];
            if (!box.isReady) continue;
            const boxData = box.getBoxData();
            if (!boxData.isFull() && boxData.word.includes(letter))
            {
                return box;
            }
        }
        return null;
    }

    public getNextBoxData(): BoxData
    {
        return this._levelController.getNextBoxData();
    }

    public async removeBox(box: Box)
    {
        const index = this._activeBoxes.indexOf(box);
        if (index >= 0)
        {
            this._activeBoxes.splice(index, 1);
            this._boxDataList.splice(index, 1);
            await box.closeLidAnimation();
            await box.moveUpAnimation();
            box.node.active = false;
            this.realignBoxes();
        }
    }

    public realignBoxes(): void
    {
        if (this._activeBoxes.length === 0) return;

        // Tính toán vị trí mới giống như trong setup
        let centerX = 0;
        for (let i = 0; i < this._activeBoxes.length; i++)
        {
            centerX += i * BOX_SPACING;
        }
        const offsetX = centerX / this._activeBoxes.length;

        // Tween các box tới vị trí mới
        for (let i = 0; i < this._activeBoxes.length; i++)
        {
            const box = this._activeBoxes[ i ];
            const targetPos = new Vec3(i * BOX_SPACING - offsetX, 0, 0);
            // Huỷ tween cũ nếu có
            Tween.stopAllByTarget(box.node);
            // Tạo tween mới
            tween(box.node)
                .to(0.23, { position: targetPos }, { easing: 'cubicInOut' })
                .start();
        }
    }

    public getActiveBoxCount(): number
    {
        return this._activeBoxes.length;
    }

    public isAllBoxesReady(): boolean
    {
        for (let i = 0; i < this._activeBoxes.length; i++)
        {
            if (!this._activeBoxes[i].isReady) return false;
        }
        return true;
    }

    public isAllBoxFilled(): boolean
    {
        for (let i = 0; i < this._activeBoxes.length; i++)
        {
            const boxData = this._activeBoxes[i].getBoxData();
            if (!boxData.isFull()) return false;
        }
        return true;
    }

    public getAllLettersInBoxes(): Set<string>
    {
        const letters: Set<string> = new Set<string>();
        for (let i = 0; i < this._activeBoxes.length; i++)
        {
            const boxData = this._activeBoxes[i].getBoxData();
            for (const letter of boxData.word) {
                letters.add(letter);
            }
        }
        return letters;
    }
}

