import { Animation, DrawArgs, MakeDrawFn, ParameterConfig } from 'lib/Animation';
import Graphics from 'lib/graphics';
import Utils from 'lib/utils';

const Hypocycloids = () => {
    const duration = 12;
    const canvasWidth = 1024;
    const canvasHeight = 1024;

    const parameters = {
        theta: {
            min: 0,
            max: 4 * Math.PI,
            // Start and end at 4 * Math.PI, linear between 4 and duration - 4 seconds.
            compute: (t: number) =>
                (4 * Math.PI * (Utils.smoothstepI(t, 0, 4) - Utils.smoothstepI(t, duration - 4, duration))) /
                (duration - 4),
            step: 0.01,
        },
        n: {
            min: 2,
            max: 16,
            default: 3,
            step: 1,
        },
    } as const satisfies ParameterConfig;

    const makeDrawFn: MakeDrawFn<typeof parameters> = (canvas) => {
        const ctx = canvas.getContext('2d')!;

        const drawFn = ({ theta, n }: DrawArgs<typeof parameters>) => {
            theta = Math.min(theta, 4 * Math.PI - 1e-5);
            const r = 1 / n;
            const inFirstHalf = theta < 2 * Math.PI;
            const traceInFn = (th: number) => [
                Math.sin(th) * (1 - r) - Math.sin((th * (1 - r)) / r) * r,
                Math.cos(th) * (1 - r) + Math.cos((th * (1 - r)) / r) * r,
            ];
            const traceOutFn = (th: number) => [
                Math.sin(th) * (1 + r) - Math.sin((th * (1 + r)) / r) * r,
                Math.cos(th) * (1 + r) - Math.cos((th * (1 + r)) / r) * r,
            ];
            const plotRange = 1 + 2 * r + 0.1;
            Graphics.draw(
                [
                    Graphics.AbsoluteLineWidth(4),
                    Graphics.Set({ strokeStyle: '#ffffff' }),
                    Graphics.Disk({ center: [0, 0], radius: 1, fill: false, edge: true }),
                    [
                        Graphics.Set({ strokeStyle: '#bbeafe' }),
                        // Trace inside.
                        Graphics.Line({
                            pts: Utils.range(inFirstHalf ? 0 : 4 * Math.PI, theta, inFirstHalf ? 0.01 : -0.01).map(
                                traceInFn,
                            ),
                        }),
                        // Trace outside.
                        Graphics.Line({
                            pts: Utils.range(inFirstHalf ? 0 : 4 * Math.PI, theta, inFirstHalf ? 0.01 : -0.01).map(
                                traceOutFn,
                            ),
                        }),
                    ],
                    [
                        Graphics.Rotate({ angle: theta, center: [0, 0] }),
                        // Rolling circles.
                        Graphics.Set({ fillStyle: '#ffffff16' }),
                        [
                            // inside
                            Graphics.Disk({ center: [0, 1 - r], radius: r, fill: true, edge: true }),
                            Graphics.Rotate({ angle: -theta / r, center: [0, 1 - r] }),
                            // Point on rolling circle.
                            Graphics.Set({ fillStyle: '#f39034', strokeStyle: 'black' }),
                            Graphics.Disk({
                                center: [0, 1],
                                radius: 16,
                                fill: true,
                                edge: true,
                                radiusInPixels: true,
                            }),
                        ],
                        [
                            // outside
                            Graphics.Disk({ center: [0, 1 + r], radius: r, fill: true, edge: true }),
                            Graphics.Rotate({ angle: theta / r, center: [0, 1 + r] }),
                            // Point on rolling circle.
                            Graphics.Set({ fillStyle: '#f39034', strokeStyle: 'black' }),
                            Graphics.Disk({
                                center: [0, 1],
                                radius: 16,
                                fill: true,
                                edge: true,
                                radiusInPixels: true,
                            }),
                        ],
                    ],
                ],

                {
                    xmin: -plotRange,
                    xmax: plotRange,
                    ymin: -plotRange,
                    ymax: plotRange,
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

export default Hypocycloids;
