// @ts-ignore
import { GlslPipeline } from 'glsl-pipeline';
import { RepeatWrapping, TextureLoader, WebGLRenderer } from 'three';

import { Animation, DrawArgs, MakeDrawFn, ParameterConfig } from 'lib/Animation';
import Utils from 'lib/utils';

import shader from './shaders/dither.glsl';

const Dither = () => {
    const duration = 6;
    const canvasWidth = 768;
    const canvasHeight = 768;

    const parameters = {} as const satisfies ParameterConfig;

    const makeDrawFn: MakeDrawFn<typeof parameters> = (canvas) => {
        const texLoader = new TextureLoader();
        let u_tex0 = texLoader.load('/animations/images/cat.jpg', () => {
            drawFn({ t: 0 });
        });
        u_tex0.generateMipmaps = false;
        u_tex0.wrapS = RepeatWrapping;
        u_tex0.wrapT = RepeatWrapping;
        const renderer = new WebGLRenderer({
            canvas,
        });
        let pipeline = new GlslPipeline(renderer, {
            u_t: { value: 0 },
            u_tt: { value: 0 },
            u_tex0: { type: 't', value: u_tex0 },
        });
        pipeline.load(shader);
        Utils.resetGlslPipeline(pipeline);

        const drawFn = ({ t }: DrawArgs<typeof parameters>) => {
            if (t == 0) {
                Utils.resetGlslPipeline(pipeline);
            }
            pipeline.uniforms.u_t.value = t;
            if (t > 0.5) {
                pipeline.uniforms.u_tt.value = t;
            }

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

export default Dither;
