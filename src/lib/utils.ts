import { start } from 'repl';

namespace Utils {
    export const range = (start: number, end: number, step: number = 1) => {
        const result: number[] = [];
        if (step === 0) {
            throw new Error('Step cannot be zero');
        }
        if (start < end && step < 0) {
            throw new Error('Step must be positive when start is less than end');
        }
        if (start > end && step > 0) {
            throw new Error('Step must be negative when start is greater than end');
        }

        for (let i = start; step > 0 ? i < end : i > end; i += step) {
            result.push(i);
        }

        return result;
    };

    export const circlePoints = ({
        num,
        center = [0, 0],
        radius = 1,
        offset = 0,
    }: {
        num: number;
        center?: number[];
        radius?: number;
        offset?: number;
    }) => {
        const a = (2 * Math.PI) / num;
        return range(0, num).map((i) => [
            center[0] + radius * Math.cos(offset + a * i),
            center[1] + radius * Math.sin(offset + a * i),
        ]);
    };

    export const smoothstep = (t: number, startT: number = 0, endT: number = 1): number => {
        const tt = (t - startT) / (endT - startT);
        if (tt <= 0) {
            return 0;
        }
        if (tt >= 1) {
            return 1;
        }
        return 6 * Math.pow(tt, 5) - 15 * Math.pow(tt, 4) + 10 * Math.pow(tt, 3);
    };

    export const smoothstepI = (t: number, startT: number = 0, endT: number = 1): number => {
        // Integral of smoothstep.
        if ((t - startT) * (startT - endT) > 0) {
            return 0.0;
        }
        if ((t - endT) * (endT - startT) > 0) {
            return 0.5 * (2 * (t - endT) + endT - startT);
        }
        return -(
            (Math.pow(t - startT, 4) *
                (2 * t * t + startT * startT + 2 * t * (startT - 3 * endT) - 4 * startT * endT + 5 * endT * endT)) /
            (2 * Math.pow(startT - endT, 5))
        );
    };
}

export default Utils;
