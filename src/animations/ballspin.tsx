import Matter from 'matter-js';

import { Animation, DrawArgs, DrawFn, MakeDrawFn, Parameter } from 'lib/Animation';
import Graphics from 'lib/graphics';
import Utils from 'lib/utils';

const Ballspin = () => {
    const duration = 24;
    const canvasWidth = 1024;
    const canvasHeight = 1024;
    const bgColor = '#020115';

    const parameters: Parameter[] = [{ name: 'ground', minValue: 0, maxValue: 1, defaultValue: 0, step: 1.0 }];

    const makeDrawFn: MakeDrawFn = (canvas) => {
        const ctx = canvas.getContext('2d')!;
        const plotRange = 512;

        const engine = Matter.Engine.create();
        engine.gravity = { x: 0, y: -1, scale: 300.0 };
        const ballInitParams = {
            x: plotRange / 2,
            y: 0.75 * plotRange,
            vx: 1200,
            vy: 1000,
            angle: 0,
            angularVelocity: 0.0,
        };
        const ball1 = Matter.Bodies.circle(ballInitParams.x, ballInitParams.y, 20, {
            restitution: 0.99,
            collisionFilter: { mask: 2, category: 1 },
        });
        const ball2 = Matter.Bodies.circle(ballInitParams.x, ballInitParams.y, 20, {
            restitution: 0.99,
            collisionFilter: { mask: 2, category: 1 },
        });
        const numPieces = 64;
        const radius = (0.9 * plotRange) / 2;
        const overhang = 1.0;
        const groundPieces = Utils.range(-overhang, overhang + Math.PI, (Math.PI + 2 * overhang) / (numPieces - 1)).map(
            (th) =>
                Matter.Bodies.rectangle(
                    plotRange / 2 - radius * Math.cos(th),
                    plotRange / 2 - radius * Math.sin(th),
                    6,
                    (2 * (Math.PI * radius)) / numPieces,
                    {
                        isStatic: true,
                        angle: th,
                        collisionFilter: { category: 2, mask: 1 },
                    },
                ),
        );

        Matter.World.add(engine.world, [ball1, ball2, ...groundPieces]);
        let lastT = 0.0;

        const ballGraphics = (ball: Matter.Body) => [
            Graphics.Translate({ offset: [ball.position.x, ball.position.y] }),
            Graphics.Rotate({ angle: -ball.angle, center: [0, 0] }),
            Graphics.Disk({
                center: [0, 0],
                radius: ball.circleRadius!,
                fill: true,
                edge: false,
            }),
            Graphics.Line({
                pts: [
                    [-ball.circleRadius!, 0],
                    [ball.circleRadius!, 0],
                ],
            }),
        ];

        const initBall = (ball: Matter.Body, nudge: number) => {
            Matter.Body.setPosition(ball, { x: ballInitParams.x, y: ballInitParams.y });
            Matter.Body.setVelocity(ball, { x: ballInitParams.vx + nudge, y: ballInitParams.vy });
            Matter.Body.setAngle(ball, ballInitParams.angle);
            Matter.Body.setAngularVelocity(ball, ballInitParams.angularVelocity);
        };

        let trace1: number[][] = [];
        let trace2: number[][] = [];

        const drawFn: DrawFn = ({ t, ground }: DrawArgs) => {
            if (t == 0.0) {
                initBall(ball1, 0);
                initBall(ball2, 0.1);
                trace1 = [];
                trace2 = [];
            }
            const deltaT = t - lastT;
            lastT = t;
            if (deltaT > 0 && deltaT < 0.1) {
                const deltaT2 = deltaT / 12;
                for (let i = 0; i < 12; i++) {
                    Matter.Engine.update(engine, deltaT2);
                    if (i % 4 == 0) {
                        trace1.push([ball2.position.x, ball2.position.y]);
                        trace2.push([ball1.position.x, ball1.position.y]);
                    }
                }
            }

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            Graphics.draw(
                [
                    Graphics.AbsoluteLineWidth(4),
                    [Graphics.Set({ strokeStyle: '#985e00ff' }), Graphics.Line({ pts: trace1 })],
                    [Graphics.Set({ strokeStyle: '#5290a5ff' }), Graphics.Line({ pts: trace2 })],
                    [Graphics.Set({ fillStyle: '#7dddfca0', strokeStyle: bgColor }), ballGraphics(ball1)],
                    [Graphics.Set({ fillStyle: '#ff9d00b5', strokeStyle: bgColor }), ballGraphics(ball2)],
                    // ground
                    Graphics.Set({ fillStyle: '#ff000062', strokeStyle: '#ffffffff', lineWidth: 6 }),
                    Graphics.Disk({ center: [plotRange / 2, plotRange / 2], radius, fill: false, edge: true }),
                    ground > 0.5
                        ? groundPieces.map((ground) =>
                              Graphics.Polygon({
                                  pts: ground.vertices.map((pt) => [pt.x, pt.y]),
                                  edge: false,
                                  fill: true,
                              }),
                          )
                        : [],
                ],

                {
                    xmin: 0,
                    xmax: plotRange,
                    ymin: 0,
                    ymax: plotRange,
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
            enableTimeControl={false}
        />
    );
};

export default Ballspin;
