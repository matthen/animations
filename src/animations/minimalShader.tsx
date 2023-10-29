// @ts-ignore
import { GlslPipeline } from 'glsl-pipeline';
import { WebGLRenderer } from 'three';

import { Animation, DrawArgs, DrawFn, MakeDrawFn, Parameter } from 'lib/Animation';

import shader from './shaders/minimalShader.glsl';

const MinimalShader = () => {
    const duration = 10;
    const canvasWidth = 768;
    const canvasHeight = 768;

    const parameters: Parameter[] = [{ name: 'speed', minValue: 0, maxValue: 10, defaultValue: 1 }];

    const makeDrawFn: MakeDrawFn = (canvas) => {
        const renderer = new WebGLRenderer({
            canvas,
        });
        let pipeline: GlslPipeline | undefined;

        const drawFn: DrawFn = ({ t, speed }: DrawArgs) => {
            if (t == 0) {
                pipeline = new GlslPipeline(renderer, { u_t: { value: t }, u_speed: { value: speed } });
                pipeline.load(shader);
            }
            if (pipeline) {
                pipeline.uniforms.u_t.value = t;
                pipeline.uniforms.u_speed.value = speed;
                pipeline.renderMain();
            }
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
