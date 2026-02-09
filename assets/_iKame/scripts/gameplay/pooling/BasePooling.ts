import { _decorator, CCString, Component, instantiate, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BasePooling')
export abstract class BasePooling<T> extends Component {

    protected _pool: T[] = [];
    @property(Prefab)
    protected prefab: Prefab = null!;
    @property([Node])
    protected prespawnNodes: Node[] = [];
    @property(CCString)
    protected componentName: string = '';
    
    protected onLoad(): void
    {
        for (let i = 0; i < this.prespawnNodes.length; i++)
        {
            const node = this.prespawnNodes[ i ];
            const component = node.getComponent(this.componentName) as T;
            this._pool.push(component);
        }
    }

    public getObject(): T | null
    {
        if (this._pool.length > 0)
        {
            return this._pool.pop() as T;
        }
        const node = instantiate(this.prefab);
        node.setParent(this.node);
        const component = node.getComponent(this.componentName) as T;
        return component;
    }

    public returnObject(obj: T): void
    {
        (obj as Component).node.setParent(this.node);
        (obj as Component).node.active = false;
        this._pool.push(obj);
    }

}


