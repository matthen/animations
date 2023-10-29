import chroma from 'chroma-js';

import { Animation, DrawArgs, DrawFn, MakeDrawFn, Parameter } from 'lib/Animation';
import Graphics from 'lib/graphics';
import Utils from 'lib/utils';

const PiArcs = () => {
    const duration = 56;
    const canvasWidth = 1024;
    const canvasHeight = 1024;
    const bgColor = '#020115';

    const tt = (t: number) =>
        0.25 * t +
        0.25 * Utils.smoothstepI(t, 2, 3) +
        Utils.smoothstepI(t, 10, 15) +
        1.5 * Utils.smoothstepI(t, 15, 20) +
        10 * Utils.smoothstepI(t, 20, 40) -
        13 * Utils.smoothstepI(t, duration - 3.5, duration - 0.5);

    const parameters: Parameter[] = [
        {
            name: 'arc',
            minValue: 0,
            maxValue: 1,
            step: 0.01,
            compute: (t) => Utils.smoothstep(Utils.frac(tt(t)), 0, 0.5),
        },
        {
            name: 'next',
            minValue: 0,
            maxValue: 1,
            step: 0.01,
            compute: (t) => Utils.smoothstep(Utils.frac(tt(t)), 0.5, 1.0),
        },
        { name: 'index', minValue: 0, maxValue: Utils.piDigits.length - 1, step: 1, compute: (t) => Math.floor(tt(t)) },

        {
            name: 'zoom',
            minValue: 1,
            maxValue: 100,
            step: 0.01,
            compute: (t) => 2.4 + 8 * Utils.smoothstep(tt(t), 1, 14) + tt(t) * 0.1,
        },

        { name: 'centreX', minValue: -20, maxValue: 20, compute: (t) => 0.7 + 4 * Utils.smoothstep(tt(t), 1, 14) },
        {
            name: 'centreY',
            minValue: -20,
            maxValue: 20,
            compute: (t) => -0.8 + 7 * Utils.smoothstep(tt(t), 1, 14) + 0.015 * Utils.smoothstepI(tt(t), 14, 30),
        },
    ];
    const pyByFive = Math.PI / 5;

    const makeDrawFn: MakeDrawFn = (canvas) => {
        const ctx = canvas.getContext('2d')!;

        const drawFn: DrawFn = ({ t, arc, next, index, zoom, centreX, centreY }: DrawArgs) => {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            const digit = Number(Utils.piDigits[index]);
            const even = index % 2 == 0;
            const angle = pyByFive * (digit > 0 ? digit : 10);
            let oddOpacity = 0.0;
            let evenOpacity = 0.0;
            oddOpacity = Math.max(0, 1.0 - 2 * next);
            evenOpacity = Math.max(0, Math.min(1, -1 + 2 * next));
            if (!even) {
                [oddOpacity, evenOpacity] = [evenOpacity, oddOpacity];
            }

            let arcStyles = [
                Graphics.Set({ strokeStyle: '#ff36e8af' }),
                Graphics.Set({ lineWidth: 0.06 * Math.pow(zoom / 2.4, 0.6) }),
            ];
            let transformsAndPreviousArcs: Graphics.DrawCommand[] = [];
            for (let i = 0; i < index; i++) {
                const digitI = Number(Utils.piDigits[i]);
                const angleI = pyByFive * (digitI > 0 ? digitI : 9.999);
                transformsAndPreviousArcs.push(
                    Graphics.Disk({
                        center: [0, 0],
                        radius: 1,
                        fill: false,
                        edge: true,
                        startAngle: i % 2 == 0 ? -0.5 * Math.PI : -0.5 * Math.PI - angleI,
                        endAngle: i % 2 == 0 ? -0.5 * Math.PI + angleI : -0.5 * Math.PI,
                        sector: false,
                    }),
                );
                if (i % 2 == 0) {
                    transformsAndPreviousArcs.push(
                        Graphics.Translate({ offset: [2 * Math.sin(angleI), 2 * Math.cos(angleI)] }),
                    );
                    transformsAndPreviousArcs.push(Graphics.Rotate({ center: [0, 0], angle: angleI - Math.PI }));
                } else {
                    transformsAndPreviousArcs.push(
                        Graphics.Translate({ offset: [2 * Math.sin(-angleI), 2 * Math.cos(-angleI)] }),
                    );
                    transformsAndPreviousArcs.push(Graphics.Rotate({ center: [0, 0], angle: Math.PI - angleI }));
                }
            }

            let piStrings = ['3.'];
            for (let i = 1; i <= index; i++) {
                piStrings[piStrings.length - 1] += Utils.piDigits[i];
                if (i % 54 == 0) {
                    piStrings.push('  ');
                }
            }

            Graphics.draw(
                [
                    Graphics.Set({
                        font: '28px Courier',
                        fillStyle: '#a3a3ae',
                        textAlign: 'left',
                        textBaseline: 'top',
                    }),
                    piStrings.map((str, i) => Graphics.Text({ at: [24, 230 - i * 28], text: str })),
                ],
                { xmin: 0, ymin: 0, xmax: canvasWidth, ymax: canvasHeight },
                ctx,
            );

            Graphics.draw(
                [
                    [
                        // Move it using translates and rotates.
                        ...arcStyles,
                        ...transformsAndPreviousArcs,
                        Graphics.Set({ lineWidth: 0.02 }),

                        [
                            // Filled in arc
                            Graphics.Set({
                                fillStyle: chroma('#178585')
                                    .alpha(1 - next)
                                    .css(),
                            }),
                            Graphics.Disk({
                                center: [0, 0],
                                radius: 1,
                                fill: true,
                                edge: false,
                                startAngle: even ? -0.5 * Math.PI : -0.5 * Math.PI - angle * arc,
                                endAngle: even ? -0.5 * Math.PI + angle * arc : -0.5 * Math.PI,
                                sector: true,
                            }),
                        ],
                        [
                            // The 'clock'
                            even
                                ? Graphics.Translate({
                                      offset: [next * 2 * Math.sin(angle), next * 2 * Math.cos(angle)],
                                  })
                                : Graphics.Translate({
                                      offset: [next * 2 * Math.sin(-angle), next * 2 * Math.cos(-angle)],
                                  }),
                            even
                                ? Graphics.Rotate({
                                      center: [0, 0],
                                      angle: next > 0.5 ? angle - Math.PI : 0,
                                  })
                                : Graphics.Rotate({
                                      center: [0, 0],
                                      angle: next > 0.5 ? Math.PI - angle : 0,
                                  }),
                            Graphics.Set({
                                strokeStyle: 'white',
                                fillStyle: 'white',
                                font: '0.2px serif',
                                textAlign: 'center',
                                textBaseline: 'middle',
                            }),

                            Utils.range(-0.5 * Math.PI, 1.5 * Math.PI, pyByFive).map((th, i) => [
                                Graphics.Disk({
                                    center: [0, 0],
                                    radius: 1,
                                    fill: false,
                                    edge: true,
                                    startAngle: th,
                                    endAngle: th + pyByFive,
                                    sector: true,
                                }),
                                [
                                    [
                                        Graphics.Set({
                                            fillStyle: chroma('white').alpha(oddOpacity).css(),
                                        }),
                                        Graphics.Text({
                                            at: [0.7 * Math.cos(th + pyByFive / 2), -0.7 * Math.sin(th + pyByFive / 2)],
                                            text: `${(i + 1) % 10}`,
                                        }),
                                    ],
                                    [
                                        Graphics.Set({
                                            fillStyle: chroma('white').alpha(evenOpacity).css(),
                                        }),
                                        Graphics.Text({
                                            at: [0.7 * Math.cos(th + pyByFive / 2), -0.7 * Math.sin(th + pyByFive / 2)],
                                            text: `${(10 - i) % 10}`,
                                        }),
                                    ],
                                ],
                            ]),
                        ],
                        [
                            // New arc
                            ...arcStyles,
                            Graphics.Disk({
                                center: [0, 0],
                                radius: 1,
                                fill: false,
                                edge: true,
                                startAngle: even ? -0.5 * Math.PI : -0.5 * Math.PI - angle * arc,
                                endAngle: even ? -0.5 * Math.PI + angle * arc : -0.5 * Math.PI,
                                sector: false,
                            }),
                        ],
                    ],
                ],
                {
                    xmin: centreX - zoom,
                    xmax: centreX + zoom,
                    ymin: centreY - zoom,
                    ymax: centreY + zoom,
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
            enableTimeControl={true}
        />
    );
};

export default PiArcs;
