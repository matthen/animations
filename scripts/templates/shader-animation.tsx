// @ts-ignore
import { GlslPipeline } from 'glsl-pipeline';
import { WebGLRenderer } from 'three';

import { Animation, DrawArgs, DrawFn, MakeDrawFn, Parameter } from 'lib/Animation';
import Utils from 'lib/utils';

import shader from './shaders/{{CAMEL_NAME}}.glsl';

const {{PASCAL_NAME}} = () => {
    const duration = 6;
    const canvasWidth = 768;
    const canvasHeight = 768;

    const parameters: Parameter[] = [
{{PARAMETER_DEFINITIONS}}
    ];

    const makeDrawFn: MakeDrawFn = (canvas) => {
        const renderer = new WebGLRenderer({
            canvas,
        });
        let pipeline = new GlslPipeline(renderer, {{UNIFORMS_OBJECT}});
        pipeline.load(shader);
        pipeline.renderMain();

        const drawFn: DrawFn = ({{DRAW_ARGS_TYPE}}: DrawArgs) => {
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