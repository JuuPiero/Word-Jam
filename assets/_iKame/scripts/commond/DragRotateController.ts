import { _decorator, Component, EventTouch, input, Input, math, Node, Quat, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DragRotateController')
export class DragRotateController extends Component {
    @property
    threshold: number = 0;
    @property
    sensitivity: number = 1000;
    @property
    maxVelocity: number = 10000.0;
    @property
    autoRotateInterval: number = 5.0;
 
    @property
    is360: boolean = false;

    private _currentVelocity: Vec2 = new Vec2();
    private _lastTimeDrag: number = 0;
    private _isDragging: boolean = false;
    private _noInputThreshold: number = 2500;
    private _startAngle = new Vec3(0, 0, 0);

    public allowAutoRotate: boolean = false;



    onDestroy()
    {
        // input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        // input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        // input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    update(deltaTime: number)
    {
        this.handleRotate();
        this.handleAutoRotate(deltaTime);
    }

    checkInputTimeout()
    {
        const currentTime = performance.now();
        if (currentTime - this._lastTimeDrag > this._noInputThreshold)
        {
            this._currentVelocity = new Vec2(-0.15, 0);
        }
    }

    handleRotate()
    {
        if (this._currentVelocity.length() < this.threshold) return;
        // Implement rotation logic here
        const mag = this._currentVelocity.length();
        const dir = this._currentVelocity.normalize();
        const mag2 = math.lerp(mag, 0, 0.15);
        this._currentVelocity = dir.multiplyScalar(mag2);

        let final = this._currentVelocity.multiplyScalar(this.sensitivity);

        // claim velocity
        if (final.length() > this.maxVelocity)
        {
            final = final.normalize().multiplyScalar(this.maxVelocity);
        }

        // Rotate around the up vector
        this.node.rotate(Quat.fromAxisAngle(new Quat(), Vec3.UP, final.x), Node.NodeSpace.WORLD);
        // Rotate around the right vector
        if (this.is360)
        {
            this.node.rotate(Quat.fromAxisAngle(new Quat(), Vec3.RIGHT, -final.y * 0.7), Node.NodeSpace.WORLD);
        }
    }

    onTouchMove(event: EventTouch)
    {
        const delta = event.getDelta();
        const deltaVec = new Vec2(delta.x, delta.y);
        if (deltaVec.length() >= this.threshold)
        {
            this._currentVelocity.add(deltaVec);
            this._lastTimeDrag = performance.now();
            this._isDragging = true;
        }
    }

    onTouchStart(event: EventTouch)
    {
        this._lastTimeDrag = performance.now();

        // this._isDragging = true;
        //this._currentVelocity.set( 0, 0 );
    }

    onTouchEnd(event: EventTouch)
    {
        this._isDragging = false;
    }

    handleAutoRotate(deltaTime: number)
    {
        if (!this.allowAutoRotate || this.isDragging())
            return;
        if (performance.now() - this._lastTimeDrag > this.autoRotateInterval * 1000)
        {
            this.node.rotate(Quat.fromAxisAngle(new Quat(), Vec3.UP, deltaTime * 0.1), Node.NodeSpace.WORLD);
        }
    }

    public isDragging(): boolean
    {
        return this._isDragging 
    }
}


