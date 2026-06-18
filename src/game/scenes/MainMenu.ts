import { Scene, GameObjects } from 'phaser';
import { getSceneScale } from '../utils/SceneScaling';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { centerX, centerY, scale } = getSceneScale(this);

        this.background = this.add.image(centerX, centerY, 'background');
        this.background.setScale(scale);

        this.logo = this.add.image(centerX, centerY - (84 * scale), 'logo');
        this.logo.setScale(scale);

        this.title = this.add.text(centerX, centerY + (76 * scale), 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: Math.round(38 * scale), color: '#ffffff',
            stroke: '#000000', strokeThickness: Math.round(8 * scale),
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {

            this.scene.start('Game');

        });
    }
}
