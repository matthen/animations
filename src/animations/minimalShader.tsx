// @ts-ignore
import { GlslPipeline } from 'glsl-pipeline';
import { WebGLRenderer } from 'three';

import { Animation, DrawArgs, MakeDrawFn, ParameterConfig } from 'lib/Animation';
import Utils from 'lib/utils';

import shader from './shaders/minimalShader.glsl';

const MinimalShader = () => {
    const duration = 2;
    const canvasWidth = 768;
    const canvasHeight = 768;

    const parameters = { speed: { min: 0, max: 10, default: 1 } } as const satisfies ParameterConfig;

    const makeDrawFn: MakeDrawFn<typeof parameters> = (canvas) => {
        const renderer = new WebGLRenderer({
            canvas,
        });
        let pipeline = new GlslPipeline(renderer, { u_t: { value: 0 }, u_speed: { value: 0 } });
        pipeline.load(shader);
        pipeline.renderMain();

        const drawFn = ({ t, speed }: DrawArgs<typeof parameters>) => {
            if (t == 0) {
                Utils.resetGlslPipeline(pipeline);
            }
            pipeline.uniforms.u_t.value = t;
            pipeline.uniforms.u_speed.value = speed;
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

export default MinimalShader;
