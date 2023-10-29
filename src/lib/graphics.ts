namespace Graphics {
    export type DrawCommand = (ctx: CanvasRenderingContext2D) => void;

    type CanvasState = {
        strokeStyle: string;
        fillStyle: string;
        globalAlpha: number;
        lineWidth: number;
        lineCap: 'butt' | 'round' | 'square';
        lineJoin: 'round' | 'bevel' | 'miter';
        miterLimit: number;
        lineDashOffset: number;
        shadowOffsetX: number;
        shadowOffsetY: number;
        shadowBlur: number;
        shadowColor: string;
        font: string;
        textAlign: 'left' | 'right' | 'center' | 'start' | 'end';
        textBaseline: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom';
        direction: 'ltr' | 'rtl' | 'inherit';
        imageSmoothingEnabled: boolean;
    };

    export const Set = (values: Partial<CanvasState>): DrawCommand => {
        return (ctx) => {
            for (const key in values) {
                if (values.hasOwnProperty(key)) {
                    // Check if the property exists in CanvasState before setting
                    if (key in ctx) {
                        // @ts-ignore
                        ctx[key] = values[key];
                    }
                }
            }
        };
    };

    export const AbsoluteLineWidth = (pixels: number): DrawCommand => {
        return (ctx) => {
            const transform = ctx.getTransform();
            ctx.lineWidth = pixels / Math.sqrt(transform.a * transform.a + transform.b * transform.b);
        };
    };

    export const Disk = ({
        center,
        radius,
        fill,
        edge,
        startAngle = 0,
        endAngle = 2 * Math.PI,
        sector = false,
    }: {
        center: number[];
        radius: number;
        fill: boolean;
        edge: boolean;
        startAngle?: number;
        endAngle?: number;
        sector?: boolean;
    }): DrawCommand => {
        return (ctx) => {
            if (!fill && !edge) {
                return;
            }
            const oldFillStyle = ctx.fillStyle;
            if (!fill) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0)';
            }
            ctx.beginPath();
            if (sector) {
                ctx.moveTo(center[0], center[1]);
            }
            ctx.arc(center[0], -center[1], radius, startAngle, endAngle);
            if (sector) {
                ctx.moveTo(center[0], center[1]);
            }
            ctx.fill();
            if (edge) {
                ctx.stroke();
            }
            ctx.fillStyle = oldFillStyle;
        };
    };

    export const Polygon = ({ pts, edge, fill }: { pts: number[][]; edge: boolean; fill: boolean }): DrawCommand => {
        return (ctx) => {
            if (!fill && !edge) {
                return;
            }
            const oldFillStyle = ctx.fillStyle;
            if (!fill) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0)';
            }
            ctx.beginPath();
            const [x0, y0] = pts[0];
            ctx.moveTo(x0, -y0);
            pts.forEach(([x, y]) => ctx.lineTo(x, -y));
            ctx.lineTo(x0, -y0);
            ctx.fill();
            if (edge) {
                ctx.stroke();
            }
            ctx.fillStyle = oldFillStyle;
        };
    };

    export const Line = ({ pts }: { pts: number[][] }): DrawCommand => {
        return (ctx) => {
            if (pts.length == 0) {
                return;
            }
            ctx.beginPath();
            const [x0, y0] = pts[0];
            ctx.moveTo(x0, -y0);
            pts.forEach(([x, y]) => ctx.lineTo(x, -y));
            ctx.stroke();
        };
    };

    export const Text = ({ at, text }: { at: number[]; text: string }): DrawCommand => {
        return (ctx) => {
            const [x, y] = at;
            ctx.fillText(text, x, -y);
        };
    };

    export const Rotate = ({ angle, center }: { angle: number; center: number[] }): DrawCommand => {
        // Rotate clockwise by angle radians around center.
        return (ctx) => {
            const [cx, cy] = center;
            ctx.translate(cx, -cy);
            ctx.rotate(angle);
            ctx.translate(-cx, cy);
        };
    };

    export const Translate = ({ offset }: { offset: number[] }): DrawCommand => {
        return (ctx) => {
            const [x, y] = offset;
            ctx.translate(x, -y);
        };
    };

    type DrawCommands = DrawCommand | DrawCommands[];

    type DrawOptions = {
        xmin: number;
        xmax: number;
        ymin: number;
        ymax: number;
    };

    export const draw = (
        commands: DrawCommands,
        options: DrawOptions,
        ctx: CanvasRenderingContext2D,
        depth?: number,
    ): void => {
        if (Array.isArray(commands)) {
            if (commands.length == 0) {
                return;
            }
            ctx.save();
            // compute scale and translation
            if (depth === undefined) {
                ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
                ctx.scale(
                    ctx.canvas.width / (options.xmax - options.xmin),
                    ctx.canvas.height / (options.ymax - options.ymin),
                );
                // Default line width to 1 pixel.
                ctx.translate(-(options.xmin + options.xmax) / 2, (options.ymin + options.ymax) / 2);
                AbsoluteLineWidth(1)(ctx);
            }
            // then make sure all commands use negative y

            commands.forEach((command) => draw(command, options, ctx, depth === undefined ? 1 : depth + 1));
            ctx.restore();
        } else {
            commands(ctx);
        }
    };
}

export default Graphics;
