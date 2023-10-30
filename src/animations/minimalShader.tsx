// @ts-ignore
import { GlslPipeline } from 'glsl-pipeline';
import { WebGLRenderer } from 'three';

import { Animation, DrawArgs, DrawFn, MakeDrawFn, Parameter } from 'lib/Animation';
import Utils from 'lib/utils';

import shader from './shaders/minimalShader.glsl';

const MinimalShader = () => {
    const duration = 2;
    const canvasWidth = 768;
    const canvasHeight = 768;

    const parameters: Parameter[] = [{ name: 'speed', minValue: 0, maxValue: 10, defaultValue: 1 }];

    const makeDrawFn: MakeDrawFn = (canvas) => {
        const renderer = new WebGLRenderer({
            canvas,
        });
        let pipeline = new GlslPipeline(renderer, { u_t: { value: 0 }, u_speed: { value: 0 } });
        pipeline.load(shader);

        const drawFn: DrawFn = ({ t, speed }: DrawArgs) => {
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
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            makeDrawFn={makeDrawFn}
            parameters={parameters}
        />
    );
};

export default MinimalShader;
