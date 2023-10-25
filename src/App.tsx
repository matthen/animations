import { Animation, DrawArgs, DrawFn, MakeDrawFn, Parameter } from 'lib/Animation';
import Graphics from 'lib/graphics';
import Utils from 'lib/utils';

const App = () => {
    const duration = 10;
    const canvasWidth = 1024;
    const canvasHeight = 1024;

    const parameters: Parameter[] = [
        {
            name: 'theta',
            minValue: 0,
            maxValue: 4 * Math.PI,
            // Start and end at 4 * Math.PI, linear between 2 and duration - 2 seconds.
            compute: (t) =>
                (4 * Math.PI * (Utils.smoothstepI(t, 0, 2) - Utils.smoothstepI(t, duration - 2, duration))) /
                (duration - 2),
            step: 0.01,
        },
        {
            name: 'n',
            minValue: 2,
            maxValue: 16,
            defaultValue: 3,
            step: 1,
        },
    ];

    const makeDrawFn: MakeDrawFn = (canvas) => {
        const ctx = canvas.getContext('2d')!;

        const drawFn: DrawFn = ({ theta, n }: DrawArgs) => {
            const r = 1 / n;
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            const inFirstHalf = theta < 2 * Math.PI;
            const traceFn = (th: number) => [
                Math.sin(th) * (1 - r) - Math.sin((th * (1 - r)) / r) * r,
                Math.cos(th) * (1 - r) + Math.cos((th * (1 - r)) / r) * r,
            ];
            Graphics.draw(
                [
                    Graphics.AbsoluteLineWidth(4),
                    Graphics.Set({ strokeStyle: '#ffffff' }),
                    Graphics.Disk({ center: [0, 0], radius: 1, fill: false, edge: true }),
                    [
                        // Trace
                        Graphics.Set({ strokeStyle: '#bbeafe' }),
                        Graphics.Line({
                            pts: Utils.range(inFirstHalf ? 0 : 4 * Math.PI, theta, inFirstHalf ? 0.01 : -0.01).map(
                                traceFn,
                            ),
                        }),
                    ],

                    [
                        Graphics.Rotate({ angle: theta, center: [0, 0] }),
                        // Rolling circle.
                        Graphics.Set({ fillStyle: '#ffffff16' }),
                        Graphics.Disk({ center: [0, 1 - r], radius: r, fill: true, edge: true }),
                        Graphics.Rotate({ angle: -theta / r, center: [0, 1 - r] }),
                        // Point on rolling circle.
                        Graphics.Set({ fillStyle: '#75fffa', strokeStyle: 'black' }),
                        Graphics.Disk({ center: [0, 1], radius: 0.03, fill: true, edge: true }),
                    ],
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
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            makeDrawFn={makeDrawFn}
            parameters={parameters}
        />
    );
};

export default App;
