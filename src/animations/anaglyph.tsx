// @ts-ignore
import { GlslPipeline } from 'glsl-pipeline';
import { RepeatWrapping, TextureLoader, WebGLRenderer } from 'three';

import { Animation, DrawArgs, DrawFn, MakeDrawFn, Parameter } from 'lib/Animation';
import Utils from 'lib/utils';

import shader from './shaders/anaglyph.glsl';

const Anaglyph = () => {
    const duration = 6;
    const canvasWidth = 768;
    const canvasHeight = 768;

    const parameters: Parameter[] = [
        {
            name: 'redness',
            minValue: 0,
            maxValue: 1,
            defaultValue: 0,
            compute: Utils.makeTransitionFunction([
                {
                    easing: 'smoothstep',
                    startT: 0.5,
                    endT: duration - 0.5,
                    startValue: 0,
                    endValue: 1,
                },
            ]),
        },
    ];

    const makeDrawFn: MakeDrawFn = (canvas) => {
        const texLoader = new TextureLoader();
        let u_tex0 = texLoader.load('/animations/images/butterfly-text.png', () => {
            drawFn({ t: 0, redness: 0 });
        });
        u_tex0.generateMipmaps = false;
        u_tex0.wrapS = RepeatWrapping;
        u_tex0.wrapT = RepeatWrapping;
        const renderer = new WebGLRenderer({
            canvas,
        });
        let pipeline = new GlslPipeline(renderer, { u_redness: { value: 0 }, u_tex0: { type: 't', value: u_tex0 } });
        pipeline.load(shader);
        Utils.resetGlslPipeline(pipeline);

        const drawFn: DrawFn = ({ t, redness }: DrawArgs) => {
            if (t == 0) {
                Utils.resetGlslPipeline(pipeline);
            }
            pipeline.uniforms.u_redness.value = redness;
            pipeline.renderMain();
        };

        return drawFn;
    };

    return (
        <Animation
            duration={duration}
            initialCanvasWidth={canvasWidth}
            initialCanvasHeight={canvasHeight}
            makeDrawFn={makeDrawFn}
            parameters={parameters}
        />
    );
};

export default Anaglyph;
