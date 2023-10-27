import React from 'react';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { IconContext } from 'react-icons';
import { FaPause, FaPlay, FaStepBackward } from 'react-icons/fa';

export type DrawArgs = Record<string, number> & { t: number };
export type DrawFn = (args: DrawArgs) => void;
export type MakeDrawFn = (canvas: HTMLCanvasElement) => DrawFn;
export interface Parameter {
    name: string;
    compute?: (t: number) => number;
    defaultValue?: number;
    minValue: number;
    maxValue: number;
    step?: number;
}

interface AnimationOptions {
    duration: number;
    canvasWidth: number;
    canvasHeight: number;
    pixelRatio?: number;
    makeDrawFn: MakeDrawFn;
    parameters: Parameter[];
    enableTimeControl?: boolean;
}

export const Animation = (props: AnimationOptions) => {
    const enableTimeControl = props.enableTimeControl === undefined ? true : props.enableTimeControl;
    const [drawFn, setDrawFn] = useState<DrawFn | null>(null);
    const [controlMode, setControlMode] = useState('user' as 'playing' | 'user' | 'recording');
    const computeParamValues = (t: number): Record<string, number> =>
        Object.fromEntries(
            props.parameters
                .filter((param) => param.compute !== undefined)
                .map((param) => [param.name, param.compute!(t)]),
        );
    const initialDrawArgs: DrawArgs = {
        t: 0,
        ...computeParamValues(0),
        ...Object.fromEntries(
            props.parameters
                .filter((param) => param.compute === undefined)
                .map((param) => [param.name, param.defaultValue !== undefined ? param.defaultValue : param.minValue]),
        ),
    };
    const drawArgs = useRef<DrawArgs>(initialDrawArgs);
    const lastDrawArgs = useRef<DrawArgs | null>(null);
    const requestAnimationRef = useRef(0);
    const prevWindowTimeRef = useRef<null | number>(null);
    const frameTimes = useRef<number[]>([]); // Record how long frames are taking to draw for fps computations.
    const [fps, setFps] = useState(0.0);
    const [drawArgsUI, setDrawArgsUI] = useState<DrawArgs>(initialDrawArgs);
    const canvasElement = useRef<HTMLCanvasElement>();
    const CCaptureObj = useRef<any | null>();

    const setupCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
        if (!canvas) {
            return;
        }
        canvasElement.current = canvas;
        setDrawFn(() => props.makeDrawFn(canvas));
    }, []);

    const updateUI = useCallback(() => {
        const sumFrameTime = frameTimes.current.reduce((acc, time) => acc + time, 0);
        if (sumFrameTime < 30) {
            return;
        }
        const averageFrameTime = sumFrameTime / frameTimes.current.length;
        const fps = 1000 / averageFrameTime;
        while (frameTimes.current.length > 0) {
            frameTimes.current.pop();
        }
        setDrawArgsUI({ ...drawArgs.current });
        setFps(fps);
    }, []);

    useEffect(() => {
        if (controlMode == 'user') {
            drawArgs.current = { ...drawArgsUI };
        }
    }, [drawArgsUI, controlMode]);

    useEffect(() => {
        if (!drawFn) {
            return;
        }

        if (controlMode == 'recording' && canvasElement.current) {
            // @ts-ignore
            CCaptureObj.current = new CCapture({ format: 'webm', framerate: 60, name: 'export' });
            CCaptureObj.current.start();
            drawArgs.current.t = 0.0;
            prevWindowTimeRef.current = null;
        }

        const animationFrame = (windowTime: number) => {
            if (controlMode == 'playing' || controlMode == 'recording') {
                if (prevWindowTimeRef.current) {
                    const deltaTime = windowTime - prevWindowTimeRef.current;
                    frameTimes.current.push(deltaTime);
                    updateUI();
                    drawArgs.current.t += deltaTime / 1000;
                    if (drawArgs.current.t > props.duration) {
                        if (controlMode == 'recording' && CCaptureObj.current) {
                            CCaptureObj.current.stop();
                            CCaptureObj.current.save();
                            CCaptureObj.current = null;
                            setControlMode('user');
                        }
                        drawArgs.current.t = 0;
                    }
                }
                const t = drawArgs.current.t;
                drawArgs.current = {
                    ...drawArgs.current,
                    t,
                    ...computeParamValues(t),
                };
            }
            prevWindowTimeRef.current = windowTime;
            if (
                controlMode == 'recording' ||
                lastDrawArgs.current === null ||
                !areDrawArgsEqual(lastDrawArgs.current, drawArgs.current)
            ) {
                drawFn(drawArgs.current);

                if (controlMode == 'recording' && CCaptureObj.current) {
                    CCaptureObj.current.capture(canvasElement.current);
                }
            }
            lastDrawArgs.current = { ...drawArgs.current };
            requestAnimationRef.current = requestAnimationFrame(animationFrame);
        };

        prevWindowTimeRef.current = null;
        animationFrame(0);

        return () => {
            cancelAnimationFrame(requestAnimationRef.current);
        };
    }, [drawFn, controlMode]);

    const onClickPlayPause = useCallback(() => {
        if (controlMode == 'playing') {
            setControlMode('user');
        } else {
            setControlMode('playing');
        }
    }, [controlMode]);

    const onClickReset = useCallback(() => {
        if (controlMode == 'playing') {
            setControlMode('user');
        }
        setDrawArgsUI((old) => ({ ...old, t: 0.0, ...computeParamValues(0) }));
    }, [controlMode]);

    const onClickRecord = useCallback(() => {
        setControlMode('recording');
    }, []);

    const onClickCancelRecord = useCallback(() => {
        drawArgs.current.t = props.duration;
    }, []);

    const pixelRatio = props.pixelRatio || window.devicePixelRatio;

    const setParam = (e: ChangeEvent<HTMLInputElement>, param: Parameter) => {
        const value = Number(e.target.value);
        if (param.compute || controlMode == 'user') {
            setDrawArgsUI((old) => {
                return {
                    ...old,
                    ...Object.fromEntries([[param.name, value]]),
                };
            });
        } else {
            drawArgs.current[param.name] = value;
        }
    };

    return (
        <IconContext.Provider value={{ style: { verticalAlign: 'middle', display: 'inline' } }}>
            <div className="flex flex-row flex-wrap gap-4 ">
                {/* canvas */}
                <div className="">
                    <div className="bg-black">
                        <canvas
                            width={props.canvasWidth}
                            height={props.canvasHeight}
                            style={{
                                width: props.canvasWidth / pixelRatio,
                                height: props.canvasHeight / pixelRatio,
                            }}
                            ref={setupCanvas}
                        />
                    </div>
                </div>
                {/* controls */}
                <div className="flex h-full w-full flex-col gap-2 py-4" style={{ maxWidth: '512px' }}>
                    <p className={controlMode == 'playing' ? 'text-light' : 'text-neutral-400'}>{fps.toFixed(2)} fps</p>
                    <div className="flex flex-row gap-2">
                        <button
                            className="rounded bg-dark px-2 py-1 text-light hover:bg-dark-600 disabled:text-neutral-400 disabled:hover:bg-dark"
                            onClick={() => onClickRecord()}
                            disabled={controlMode == 'recording'}
                        >
                            export
                        </button>
                        {controlMode == 'recording' && (
                            <button
                                className="rounded bg-dark px-2 py-1 text-light hover:bg-dark-600 "
                                onClick={() => onClickCancelRecord()}
                            >
                                cancel
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-8 gap-2">
                        <div className="col-span-1 pr-2 text-right">
                            <button
                                className="mr-2 text-light-200 hover:text-light disabled:text-neutral-400 disabled:hover:text-neutral-400"
                                onClick={() => onClickReset()}
                                disabled={controlMode == 'recording'}
                            >
                                <FaStepBackward />
                            </button>
                            <button
                                className="text-light-200 hover:text-light disabled:text-neutral-400 disabled:hover:text-neutral-400"
                                onClick={() => onClickPlayPause()}
                                disabled={controlMode == 'recording'}
                            >
                                {controlMode == 'playing' ? <FaPause /> : <FaPlay />}
                            </button>
                        </div>
                        <div className="col-span-5">
                            <input
                                type="range"
                                min="0"
                                max={props.duration}
                                value={drawArgsUI.t}
                                step={0.01}
                                disabled={controlMode != 'user' || !enableTimeControl}
                                className="h-2 w-full appearance-none rounded-lg bg-dark accent-pink"
                                onChange={(e) =>
                                    setDrawArgsUI((old) => {
                                        return {
                                            ...old,
                                            t: Number(e.target.value),
                                            ...computeParamValues(Number(e.target.value)),
                                        };
                                    })
                                }
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="number"
                                min="0"
                                max={props.duration}
                                value={Math.round(drawArgsUI.t * 100) / 100}
                                step={0.01}
                                disabled={controlMode != 'user' || !enableTimeControl}
                                className="ml-2 w-20 appearance-none rounded bg-dark px-2 py-1"
                                onChange={(e) =>
                                    setDrawArgsUI((old) => {
                                        return {
                                            ...old,
                                            t: Number(e.target.value),
                                            ...computeParamValues(Number(e.target.value)),
                                        };
                                    })
                                }
                            />
                        </div>
                        {props.parameters.map((param) => (
                            <React.Fragment key={param.name}>
                                <div className="col-span-1 mt-1 pr-2 text-right text-sm">
                                    <p>{param.name}</p>
                                </div>
                                <div className="col-span-5">
                                    <input
                                        type="range"
                                        min={param.minValue}
                                        max={param.maxValue}
                                        value={drawArgsUI[param.name]}
                                        step={param.step || 0.01}
                                        disabled={param.compute && controlMode != 'user'}
                                        className="h-2 w-full appearance-none rounded-lg bg-dark accent-pink"
                                        onChange={(e) => {
                                            setParam(e, param);
                                        }}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max={drawArgsUI[param.name]}
                                        value={Math.round(drawArgsUI[param.name] * 100) / 100}
                                        step={param.step || 0.01}
                                        disabled={param.compute && controlMode != 'user'}
                                        className="ml-2 w-20 appearance-none rounded bg-dark px-2 py-1"
                                        onChange={(e) => {
                                            setParam(e, param);
                                        }}
                                    />
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </IconContext.Provider>
    );
};

const areDrawArgsEqual = (args1: DrawArgs, args2: DrawArgs): boolean => {
    const keys = Object.keys(args1);
    for (const key of keys) {
        if (Math.abs(args1[key] - args2[key]) > 1e-5) {
            return false;
        }
    }
    return true;
};
