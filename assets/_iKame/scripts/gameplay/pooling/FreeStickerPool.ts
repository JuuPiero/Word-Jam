import { _decorator, Component, Node } from 'cc';
import { BasePooling } from './BasePooling';
import { FreeSticker } from '../stickers/FreeSticker';
const { ccclass, property } = _decorator;

@ccclass('FreeStickerPool')
export class FreeStickerPool extends BasePooling<FreeSticker> {
    
}


