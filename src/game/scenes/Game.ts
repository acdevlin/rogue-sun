import { Scene } from 'phaser';
import { getSceneScale } from '../utils/SceneScaling';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    msg_text : Phaser.GameObjects.Text;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        const { centerX, centerY, scale } = getSceneScale(this);

        this.camera.setBackgroundColor(0x00ff00);
        this.background = this.add.image(centerX, centerY, 'background');
        this.background.setAlpha(0.5);
        this.background.setScale(scale);

        this.msg_text = this.add.text(centerX, centerY, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
            fontFamily: 'Arial Black', fontSize: Math.round(38 * scale), color: '#ffffff',
            stroke: '#000000', strokeThickness: Math.round(8 * scale),
            align: 'center'
        });
        this.msg_text.setOrigin(0.5);

        this.input.once('pointerdown', () => {

            this.scene.start('GameOver');

        });
    }
}
