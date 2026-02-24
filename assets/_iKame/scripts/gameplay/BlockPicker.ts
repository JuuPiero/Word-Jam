import { _decorator, AudioClip, Camera, Component, EventTouch, Input, input, Node, ParticleSystem, PhysicsSystem, Vec2, Vec3 } from 'cc';
import { DragRotateController } from '../commond/DragRotateController';
import { ILevelController } from '../controllers/ILevelController';
import { EventDispatcher } from '../designPatterns/observer/EventDispatcher';
import { EventName } from '../systems/EventName';
const { ccclass, property } = _decorator;

const TRANSPARENT_THRESHOLD = 0.24; // Threshold to show transparent blocks

@ccclass('BlockPicker')
export class BlockPicker extends Component {
        
    public levelController: ILevelController;

    @property(Camera)
    private mainCamera: Camera = null;

    @property(DragRotateController)
    private dragRotateController: DragRotateController = null;

    private selectedNode: Node = null;
    private showingTransparent: boolean = false;

    private screenPos: Vec2 = new Vec2();
    private uiPos: Vec2 = new Vec2();

    // @property(ParticleSystem)
    // touchParticle: ParticleSystem = null;

    protected onEnable(): void
    {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    protected onTouchStart(event: EventTouch): void
    {
        if(this.levelController.isLevelFinished())
            return;
        this.dragRotateController.onTouchStart(event);
        this.dragRotateController.allowAutoRotate = true;

        event.getLocation(this.screenPos);
        const ray = this.mainCamera.screenPointToRay(this.screenPos.x, this.screenPos.y);
        let isHit = PhysicsSystem.instance.raycast(ray);
        
        let minDistance = Number.MAX_VALUE;
        let targetNode: Node = null;

        if (isHit)
        {
            const result = PhysicsSystem.instance.raycastResults;
            for (let i = 0; i < result.length; i++)
            {
                const distance = Vec3.squaredDistance(this.mainCamera.node.getWorldPosition(), result[ i ].hitPoint);
                if (distance < minDistance)
                {
                    minDistance = distance;
                    targetNode = result[ i ].collider.node;
                }
            }

            this.selectedNode = targetNode;
            this.scheduleOnce(() => this.setBlockTransparent(), TRANSPARENT_THRESHOLD);
            return;
        }
    }

    protected onTouchMove(event: EventTouch): void
    {
        if(this.levelController.isLevelFinished())
            return;
        this.dragRotateController.onTouchMove(event);
        // if (this.dragRotateController.isDragging())
        //     this.unscheduleAllCallbacks();
    }

    protected onTouchEnd(event: EventTouch): void
    {
        if(this.levelController.isLevelFinished())
            return;
        this.unscheduleAllCallbacks();
        if (this.selectedNode)
        {
            this.levelController.showTransparentBlocks(this.selectedNode.name, false);
        }
        event.getUILocation(this.uiPos);

        this.dragRotateController.onTouchEnd(event);
        if (this.dragRotateController.isDragging() == false && this.selectedNode && !this.showingTransparent)
        {
            this.levelController.onPickObject(this.selectedNode.name);
            this.selectedNode = null;

            //TODO: enable touch particle effect later
            // this.touchParticle.node.setWorldPosition(this.uiPos.x, this.uiPos.y, 0);
            // this.touchParticle.stop();
            // this.touchParticle.clear();
            // this.touchParticle.play();
        }
        this.showingTransparent = false;
    }

    protected onDisable(): void
    {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    private setBlockTransparent(): void 
    {
        if (this.selectedNode)
            this.levelController.showTransparentBlocks(this.selectedNode.name, true);
        this.showingTransparent = true;
    }
}


