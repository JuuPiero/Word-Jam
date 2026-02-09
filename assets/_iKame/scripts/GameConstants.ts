import { Vec3 } from "cc"

export const PHYSIC_GROUP = {
    DEFAULT: 1 << 0,
    STICKER: 1 << 1,
    HOLDABLE: 1 << 2,
    FREE : 1 << 3
}

export const STICKER = {
    PEEL_DURATION: .3,
    PEEL_END_PROGRESS: 0.34,

    AFTER_PEEL_START_SCALE: new Vec3(0.7, 0.7, 0.7),
    AFTER_PEEL_END_SCALE: Vec3.ONE,
    AFTER_PEEL_DURATION: 0.2,
    AFTER_PEEL_WORLD_POSITION_OFFSET: new Vec3(-0.4, 1, 0),

    IN_BOX_SCALE: new Vec3(0.5, 0.5, 0.5),
    IN_CACHE_SCALE: new Vec3(0.4, 0.4, 0.4),

    TRANSFER_DURATION: 0.5,
}