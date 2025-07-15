// @ts-ignore
import { GlslPipeline } from 'glsl-pipeline';
import { WebGLRenderer } from 'three';

import { Animation, DrawArgs, DrawFn, MakeDrawFn, Parameter } from 'lib/Animation';
import Utils from 'lib/utils';

import shader from './shaders/noiseDodecahedron.glsl';

const NoiseDodecahedron = () => {
    const duration = 20;

    const canvasWidth = 768;
    const canvasHeight = 768;

    const parameters: Parameter[] = [
        {
            name: 'theta_1',
            minValue: 0,
            maxValue: 2 * Math.PI,
            defaultValue: 0,
            compute: Utils.makeTransitionFunction([
                {
                    easing: 'linear',
                    startT: 0,
                    endT: 20,
                    startValue: 0.0,
                    endValue: 0.1,
                },
            ]),
        },
        {
            name: 'theta_2',
            minValue: 0,
            maxValue: 2 * Math.PI,
            defaultValue: 0,
            compute: Utils.makeTransitionFunction([
                {
                    easing: 'linear',
                    startT: 0,
                    endT: 20,
                    startValue: 1.0,
                    endValue: 3.0,
                },
            ]),
        },
    ];

    const makeDrawFn: MakeDrawFn = (canvas) => {
        const renderer = new WebGLRenderer({
            canvas,
        });
        let pipeline = new GlslPipeline(renderer, {
            u_t: { value: 0 },
            u_theta_1: { value: 0 },
            u_theta_2: { value: 0 },
            u_update: { value: 0 },
        });
        pipeline.load(shader);
        pipeline.renderMain();
        let lastUpdate = -1;

        const drawFn: DrawFn = ({ t, theta_1, theta_2 }: DrawArgs) => {
            if (t == 0) {
                Utils.resetGlslPipeline(pipeline);
                lastUpdate = -1;
            }
            pipeline.uniforms.u_t.value = t;
            pipeline.uniforms.u_theta_1.value = theta_1;
            pipeline.uniforms.u_theta_2.value = theta_2;
            let update: number = 0;
            if (t - lastUpdate > 0.04) {
                update = 1;
                lastUpdate = t;
            }
            pipeline.uniforms.u_update.value = update;
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

export default NoiseDodecahedron;
