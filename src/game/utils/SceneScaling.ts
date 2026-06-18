import { Scene } from 'phaser';
import { GAME_HEIGHT_SCALE, GAME_WIDTH_SCALE } from '../../constants';

export interface SceneScale {
    centerX: number;
    centerY: number;
    scale: number;
}

export function getSceneScale(scene: Scene): SceneScale {
    const centerX = scene.cameras.main.centerX;
    const centerY = scene.cameras.main.centerY;
    const scaleX = scene.cameras.main.width / GAME_WIDTH_SCALE;
    const scaleY = scene.cameras.main.height / GAME_HEIGHT_SCALE;
    const scale = Math.min(scaleX, scaleY);

    return { centerX, centerY, scale };
}
