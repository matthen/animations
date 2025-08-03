// @ts-ignore
import { GlslPipeline } from 'glsl-pipeline';
import { WebGLRenderer } from 'three';

import { Animation, DrawArgs, MakeDrawFn, ParameterConfig } from 'lib/Animation';
import Utils from 'lib/utils';

import shader from './shaders/{{CAMEL_NAME}}.glsl';

const {{PASCAL_NAME}} = () => {
    const duration = 6;
    const canvasWidth = 768;
    const canvasHeight = 768;

    const parameters = {
{{PARAMETER_DEFINITIONS}}
    } as const satisfies ParameterConfig;

    const makeDrawFn: MakeDrawFn<typeof parameters> = (canvas) => {
        const renderer = new WebGLRenderer({
            canvas,
        });
        let pipeline = new GlslPipeline(renderer, {{UNIFORMS_OBJECT}});
        pipeline.load(shader);
        pipeline.renderMain();

        const drawFn = ({{DRAW_ARGS_TYPE}}: DrawArgs<typeof parameters>) => {
            if (t == 0) {
                Utils.resetGlslPipeline(pipeline);
            }
            pipeline.uniforms.u_t.value = t;
{{UNIFORM_ASSIGNMENTS}}
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

export default {{PASCAL_NAME}};