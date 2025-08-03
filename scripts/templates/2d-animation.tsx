import { Animation, DrawArgs, MakeDrawFn, ParameterConfig } from 'lib/Animation';
import Graphics from 'lib/graphics';
import Utils from 'lib/utils';

const {{PASCAL_NAME}} = () => {
    const duration = 6;
    const canvasWidth = 768;
    const canvasHeight = 768;

    const parameters = {
{{PARAMETER_DEFINITIONS}}
    } as const satisfies ParameterConfig;

    const makeDrawFn: MakeDrawFn<typeof parameters> = (canvas) => {
        const ctx = canvas.getContext('2d')!;

        const drawFn = ({{DRAW_ARGS_TYPE}}: DrawArgs<typeof parameters>) => {

            Graphics.draw(
                [
                    Graphics.AbsoluteLineWidth(2),
                    Graphics.Set({ strokeStyle: '#ffffff', fillStyle: '#005f5f' }),
                    // TODO: Add your drawing commands here
                    // Available parameters: {{PARAMETER_COMMENTS}}
                ],
                {
                    xmin: -1.1,
                    xmax: 1.1,
                    ymin: -1.1,
                    ymax: 1.1,
                    backgroundColor: '#020115',
                },
                ctx,
            );
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