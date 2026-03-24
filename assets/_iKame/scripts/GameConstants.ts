import { Vec3 } from "cc"

export const PHYSIC_GROUP = {
    DEFAULT: 1 << 0,
    STICKER: 1 << 1,
    HOLDABLE: 1 << 2,
    FREE : 1 << 3
}

export const STICKER = {
    PEEL_DURATION: .23,
    PEEL_END_PROGRESS: 0.4,

    AFTER_PEEL_START_SCALE: new Vec3(0.7, 0.7, 0.7),
    AFTER_PEEL_END_SCALE: Vec3.ONE,
    AFTER_PEEL_DURATION: 0.2,
    AFTER_PEEL_WORLD_POSITION_OFFSET: new Vec3(-0.4, 1, 0),

    IN_BOX_SCALE: new Vec3(0.29, 0.29, 0.29),
    IN_CACHE_SCALE: new Vec3(0.314, 0.314, 0.314),
    IN_BOX_ROTATION: new Vec3(0, 180, 0),

    TRANSFER_DURATION: 0.45,
    TRANSFER_DURATION_FROM_CACHE: 0.35,

}

export const BOX = 
{
    LID_OPEN_POS: new Vec3(0, 1.8, -6),
    LID_CLOSE_POS: new Vec3(0, -0.2, -0.473),
    LID_OPEN_ROT: new Vec3(60, 0, 0),
    LID_CLOSE_DURATION: 0.15,

    BOX_MOVE_UP_DURATION: 0.3,
    BOX_MOVE_UP_POS: new Vec3(0, 4, 0),
    BOX_START_DOWN_POS: new Vec3(0, -1.5, 0),
    BOX_START_DOWN_ROT: new Vec3(0, -180, 0)
}

export const FORCE_STORE_ON_TRANSITION = false;
export const FORCE_STORE_DURATION = 0;
export const ALLOW_REPLAY = true;

export const LEVEL =
{
    DEFAULT_SCALE: .1,
    MIN_SCALE: 0.8,
    MAX_SCALE: 1.6
}

export const EMPTY_LETTER = '_';