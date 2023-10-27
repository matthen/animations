import Matter from 'matter-js';

import { Animation, DrawArgs, DrawFn, MakeDrawFn, Parameter } from 'lib/Animation';
import Graphics from 'lib/graphics';
import Utils from 'lib/utils';

const Ballspin = () => {
    const duration = 24;
    const canvasWidth = 1024;
    const canvasHeight = 1024;
    const bgColor = '#020115';

    const parameters: Parameter[] = [];

    const makeDrawFn: MakeDrawFn = (canvas) => {
        const ctx = canvas.getContext('2d')!;
        const plotRange = 512;

        const engine = Matter.Engine.create();
        engine.gravity = { x: 0, y: -1, scale: 300.0 };
        const ballInitParams = {
            x: plotRange / 2,
            y: 300,
            vx: 1200,
            vy: 1000,
            angle: 0,
            angularVelocity: 0.0,
        };
        const ballSpin = Matter.Bodies.circle(ballInitParams.x, ballInitParams.y, 20, {
            restitution: 0.99,
            friction: 0.2,
            density: 0.1,
            frictionStatic: 10.0,
            collisionFilter: { mask: 2, category: 1 },
        });
        const ballNoSpin = Matter.Bodies.circle(ballInitParams.x, ballInitParams.y, 20, {
            restitution: 0.99,
            friction: 0.2,
            density: 0.1,
            frictionStatic: 10.0,
            //  inertia: Infinity,
            collisionFilter: { mask: 2, category: 1 },
        });
        const numPieces = 40;
        const radius = (0.9 * plotRange) / 2;
        const groundPieces = Utils.range(0, Math.PI + 1e-6, Math.PI / (numPieces - 1)).map((th) =>
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

        Matter.World.add(engine.world, [ballSpin, ballNoSpin, ...groundPieces]);
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

        const drawFn: DrawFn = ({ t }: DrawArgs) => {
            if (t == 0.0) {
                initBall(ballSpin, 0);
                initBall(ballNoSpin, 0.1);
                trace1 = [];
                trace2 = [];
            }
            const deltaT = t - lastT;
            lastT = t;
            if (deltaT > 0 && deltaT < 0.1) {
                Matter.Engine.update(engine, deltaT / 2);
                Matter.Engine.update(engine, deltaT / 2);
                trace1.push([ballNoSpin.position.x, ballNoSpin.position.y]);
                trace2.push([ballSpin.position.x, ballSpin.position.y]);
            }

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            Graphics.draw(
                [
                    Graphics.AbsoluteLineWidth(4),
                    [Graphics.Set({ strokeStyle: '#985e00ff' }), Graphics.Line({ pts: trace1 })],
                    [Graphics.Set({ strokeStyle: '#5290a5ff' }), Graphics.Line({ pts: trace2 })],
                    [Graphics.Set({ fillStyle: '#7dddfca0', strokeStyle: bgColor }), ballGraphics(ballSpin)],
                    [Graphics.Set({ fillStyle: '#ff9d00b5', strokeStyle: bgColor }), ballGraphics(ballNoSpin)],
                    // ground
                    Graphics.Set({ fillStyle: '#ff000062', strokeStyle: '#ffffffff', lineWidth: 6 }),
                    Graphics.Disk({ center: [plotRange / 2, plotRange / 2], radius, fill: false, edge: true }),
                    // groundPieces.map((ground) =>
                    //     Graphics.Polygon({ pts: ground.vertices.map((pt) => [pt.x, pt.y]), edge: false, fill: true }),
                    // ),
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
