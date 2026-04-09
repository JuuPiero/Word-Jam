import { _decorator, BoxCollider, CCBoolean, Component, JsonAsset, Material, MeshCollider, MeshRenderer, Node, PhysicMaterial, PhysicsGroup, RigidBody, Vec3 } from 'cc';
import { StickerConfigs } from '../configData/StickerConfigs';
import { Sticker } from '../gameplay/stickers/Sticker';
import { HoldableObject } from '../gameplay/holdableObject/HoldableObject';
import { PHYSIC_GROUP } from '../GameConstants';
const { ccclass, property } = _decorator;


class PLA_StikerData
{
    public stickerID: number;
    public holdingObjects: string[] = [];
    public blockingStickers: string[] = [];
    public weightLockStickers: string[] = [];
    public weightLockObjects: string[] = [];
}

class PLA_LevelData
{
    public stickers: PLA_StikerData[] = [];
} 

const HOLDABLE_OBJECT = 'HoldableObject'
const STICKER = 'Sticker'

@ccclass('LevelStickerSetup')
export class LevelStickerSetup extends Component {
    
    @property(Node) private levelRoot: Node = null;
    @property(Material) private stickerMaterial: Material = null;
    @property(Material) private holdingMaterial: Material = null;
    @property(StickerConfigs) private stickerConfig: StickerConfigs = null;
    @property(JsonAsset) protected jsonSetupData: JsonAsset = null;
    @property(PhysicMaterial) private physicMaterial: PhysicMaterial = null;

    private _stickerMapData: Map<string, Sticker> = new Map<string, Sticker>();
    private _holdingMapData: Map<string, HoldableObject> = new Map<string, HoldableObject>();
        
    private _setup: boolean = false;

    @property(CCBoolean)
    public set setup( value: boolean) {
        // This property can be used to trigger level setup logic
        this._setup = value;
        if (this._setup) {
            this.setupLevel();
        }
        this._setup = false; // Reset after setup
    }

    public get setup(): boolean {
        return this._setup;
    }

    private findAllChildNodeRecursive(parentNode: Node, out: Node[] , nameInclude : string = ''): void
    {
        for (let childNode of parentNode.children)
        {
            if (nameInclude === '' || childNode.name.includes(nameInclude)) {
                out.push(childNode);
            }
            this.findAllChildNodeRecursive(childNode, out, nameInclude);
        }
    }

    private setupLevel(): void
    {
        this._stickerMapData.clear();
        this._holdingMapData.clear();
        
        //#region Add component and material to all holdable objects and stickers
        const holdingNodes: Node[] = [];
        this.findAllChildNodeRecursive(this.levelRoot, holdingNodes, HOLDABLE_OBJECT);
        for (const holdNode of holdingNodes)
        {
            const holdableObject = holdNode.addComponent(HoldableObject);
            const meshRenderer = holdableObject.getComponent(MeshRenderer)
            if (!meshRenderer)
            {
                console.warn(`Holdable object ${holdNode.name} does not have a MeshRenderer component.`);
            }
            meshRenderer.setSharedMaterial(this.holdingMaterial, 0);
            this._holdingMapData.set(holdNode.name, holdableObject);
            const rb = holdNode.addComponent(RigidBody);
            rb.isStatic = true;
            rb.group = PHYSIC_GROUP.HOLDABLE;
            const hixBox = holdNode.addComponent(MeshCollider);
            hixBox.mesh = meshRenderer.mesh;
            hixBox.material = this.physicMaterial;
            holdableObject.rigidBody = rb;
            holdableObject.meshCollider = hixBox;
            holdableObject.freeCollider = holdNode.addComponent(MeshCollider);
            holdableObject.freeCollider.mesh = meshRenderer.mesh;
            holdableObject.freeCollider.material = this.physicMaterial;
            holdableObject.freeCollider.convex = true;
            holdableObject.freeCollider.enabled = false;
            holdableObject.mainMeshRender = meshRenderer;

            holdableObject.node.setParent(this.levelRoot, true);
        }

        const stickerNodes: Node[] = [];
        this.findAllChildNodeRecursive(this.levelRoot, stickerNodes, STICKER);
        for (const stickerNode of stickerNodes)
        {
            const sticker = stickerNode.addComponent(Sticker);
            const meshRenderer = sticker.addComponent(MeshRenderer);
            if (!meshRenderer) {
                console.warn(`Sticker ${stickerNode.name} does not have a MeshRenderer component.`);
            }

            meshRenderer.setSharedMaterial(this.stickerMaterial, 0);
            sticker.meshRenderer = meshRenderer;
            this._stickerMapData.set(stickerNode.name, sticker);
            const rb = stickerNode.addComponent(RigidBody);
            rb.isStatic = true;
            rb.group = PHYSIC_GROUP.STICKER;
        }
        //#endregion

        //#region Setup stickers data from json
        const levelSetupData: PLA_LevelData = this.jsonSetupData.json as PLA_LevelData;
        const boxColCenter = new Vec3(0, 0.04, 0);
        const boxColSize = new Vec3(0.35, 0.15, 0.5);
        for (let i = 0; i < levelSetupData.stickers.length; i++)
        {
            const stickerData = levelSetupData.stickers[i];
            const sticker = this._stickerMapData.get('Sticker_' + i);
            sticker.blockingStickers = stickerData.blockingStickers;
            sticker.holdingObjects = stickerData.holdingObjects;
            sticker.weightLockStickers = stickerData.weightLockStickers;
            sticker.weightLockObjects = stickerData.weightLockObjects;

            const meshRenderer = sticker.node.getComponent(MeshRenderer)
            const mesh = this.stickerConfig.getLetterDataByLetter("A").mesh;
            meshRenderer.mesh = mesh;
            const hitBox = sticker.node.addComponent(BoxCollider);
            hitBox.center = boxColCenter;
            hitBox.size = boxColSize;

            this.destroyAllChildNodeRecursive(sticker.node);
        }
        //#endregion

        //#region Setup holdable objects stickers reference
        for (let i = 0; i < levelSetupData.stickers.length; i++)
        {
            const stickerData = levelSetupData.stickers[i];
            const stickerName = 'Sticker_' + i;
            
            // Add this sticker reference to all holding objects
            for (const holdingObjName of stickerData.holdingObjects)
            {
                const holdableObject = this._holdingMapData.get(holdingObjName);
                if (holdableObject) {
                    holdableObject.stickers.push(stickerName);
                }
            }
        }
        //#endregion
    }

    private destroyAllChildNodeRecursive(parentNode: Node): void
    {
        for (let childNode of parentNode.children)
        {
            this.destroyAllChildNodeRecursive(childNode);
            childNode.destroy();
        }
    }
}


