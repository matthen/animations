import { Animation, DrawArgs, DrawFn, MakeDrawFn, Parameter } from 'lib/Animation';
import Graphics from 'lib/graphics';
import Utils from 'lib/utils';

const Minimal2D = () => {
    const duration = 6;
    const canvasWidth = 768;
    const canvasHeight = 768;

    const parameters: Parameter[] = [
        {
            name: 'r',
            minValue: 0.005,
            maxValue: 1,
            compute: Utils.makeTransitionFunction([
                {
                    easing: 'smoothstep',
                    startT: 1,
                    endT: 3,
                    startValue: 0.1,
                    endValue: 1.0,
                },
                {
                    easing: 'smoothstep',
                    startT: 4,
                    endT: 6,
                    endValue: 0.1,
                },
            ]),
            step: 0.005,
        },
    ];

    const makeDrawFn: MakeDrawFn = (canvas) => {
        const ctx = canvas.getContext('2d')!;

        const drawFn: DrawFn = ({ r }: DrawArgs) => {

            Graphics.draw(
                [
                    Graphics.AbsoluteLineWidth(4),
                    Graphics.Set({ strokeStyle: '#ffffff', fillStyle: '#005f5f' }),
                    Graphics.Disk({ center: [0, 0], radius: r, fill: true, edge: true }),
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

export default Minimal2D;
