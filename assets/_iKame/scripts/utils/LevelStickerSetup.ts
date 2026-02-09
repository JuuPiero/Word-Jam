import { _decorator, CCBoolean, Component, JsonAsset, Material, MeshCollider, MeshRenderer, Node, PhysicsGroup, RigidBody } from 'cc';
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
            meshRenderer.setSharedMaterial(this.holdingMaterial, 0);
            this._holdingMapData.set(holdNode.name, holdableObject);
            const rb = holdNode.addComponent(RigidBody);
            rb.isStatic = true;
            rb.group = PHYSIC_GROUP.Holdable;
            const hixBox = holdNode.addComponent(MeshCollider);
            hixBox.mesh = meshRenderer.mesh;
            holdableObject.rigidBody = rb;
        }

        const stickerNodes: Node[] = [];
        this.findAllChildNodeRecursive(this.levelRoot, stickerNodes, STICKER);
        for (const stickerNode of stickerNodes)
        {
            const sticker = stickerNode.addComponent(Sticker);
            sticker.getComponent(MeshRenderer).setSharedMaterial(this.stickerMaterial, 0);
            this._stickerMapData.set(stickerNode.name, sticker);
            const rb = stickerNode.addComponent(RigidBody);
            rb.isStatic = true;
            const hitBox = stickerNode.addComponent(MeshCollider);
            hitBox.mesh = sticker.getComponent(MeshRenderer).mesh;
            rb.group = PHYSIC_GROUP.Sticker;
        }
        //#endregion

        //#region Setup stickers data from json
        const levelSetupData: PLA_LevelData = this.jsonSetupData.json as PLA_LevelData;
        for (let i = 0; i < levelSetupData.stickers.length; i++)
        {
            const stickerData = levelSetupData.stickers[i];
            const sticker = this._stickerMapData.get('Sticker_' + i);
            sticker.blockingStickers = stickerData.blockingStickers;
            sticker.holdingObjects = stickerData.holdingObjects;
            sticker.weightLockStickers = stickerData.weightLockStickers;
            sticker.weightLockObjects = stickerData.weightLockObjects;
            sticker.stickerID = stickerData.stickerID;

            const meshRenderer = sticker.node.getComponent(MeshRenderer)
            const stickerMat = this.stickerConfig.getStickerDataByID(stickerData.stickerID).stickerMaterial;
            meshRenderer.setSharedMaterial(stickerMat, 0);

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
}


