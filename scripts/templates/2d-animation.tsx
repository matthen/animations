import { Animation, DrawArgs, DrawFn, MakeDrawFn, Parameter } from 'lib/Animation';
import Graphics from 'lib/graphics';
import Utils from 'lib/utils';

const {{PASCAL_NAME}} = () => {
    const duration = 6;
    const canvasWidth = 768;
    const canvasHeight = 768;

    const parameters: Parameter[] = [
{{PARAMETER_DEFINITIONS}}
    ];

    const makeDrawFn: MakeDrawFn = (canvas) => {
        const ctx = canvas.getContext('2d')!;

        const drawFn: DrawFn = ({{DRAW_ARGS_TYPE}}: DrawArgs) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#020115';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

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