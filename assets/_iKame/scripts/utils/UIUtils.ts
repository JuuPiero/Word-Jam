import { Camera, Vec3, Node } from "cc";

export function getUIPosition(worldPos: Vec3, camera: Camera, canvas: Node): Vec3 
{
    let pos = new Vec3();
    camera.convertToUINode(worldPos, canvas, pos);
    return pos;
}