import { Scene } from 'phaser';
import { getSceneScale } from '../utils/SceneScaling';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        const { centerX, centerY, scale } = getSceneScale(this);

        //  We loaded this image in our Boot Scene, so we can display it here
        const bg = this.add.image(centerX, centerY, 'background');
        bg.setScale(scale);

        //  A simple progress bar. This is the outline of the bar.
        const barWidth = Math.round(468 * scale);
        const barHeight = Math.round(32 * scale);
        this.add.rectangle(centerX, centerY, barWidth, barHeight).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(centerX - (230 * scale), centerY, 4, Math.round(28 * scale), 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
