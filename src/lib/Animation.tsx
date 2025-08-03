import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconContext } from 'react-icons';
import { FaLock, FaLockOpen, FaPause, FaPlay, FaStepBackward } from 'react-icons/fa';
import { useDebouncedCallback } from 'use-debounce';

// Type-safe parameter system
export interface ParameterDef {
    min: number;
    max: number;
    default?: number;
    step?: number;
    compute?: (t: number) => number;
}

export type ParameterConfig = Record<string, ParameterDef>;

// Infer DrawArgs type from parameter config
export type DrawArgs<T extends ParameterConfig> = {
    t: number;
} & {
    [K in keyof T]: number;
};

// Type-safe function types
export type DrawFn<T extends ParameterConfig> = (args: DrawArgs<T>) => void;
export type MakeDrawFn<T extends ParameterConfig> = (canvas: HTMLCanvasElement) => DrawFn<T>;

export interface AnimationOptions<T extends ParameterConfig> {
    duration: number;
    initialCanvasWidth: number;
    initialCanvasHeight: number;
    pixelRatio?: number;
    makeDrawFn: MakeDrawFn<T>;
    parameters: T;
    enableTimeControl?: boolean;
}

interface CanvasDims {
    width: number;
    height: number;
    arLocked: boolean; // Whether the aspect ratio is locked.
}

export const Animation = <T extends ParameterConfig>(props: AnimationOptions<T>) => {
    const enableTimeControl = props.enableTimeControl === undefined ? true : props.enableTimeControl;
    const [canvasDims, setCanvasDims] = useState({
        width: props.initialCanvasWidth,
        height: props.initialCanvasHeight,
        arLocked: true,
    });
    const [drawFn, setDrawFn] = useState<DrawFn<T> | null>(null);
    const [controlMode, setControlMode] = useState('user' as 'playing' | 'user' | 'recording');
    const computeParamValues = (t: number): Record<string, number> =>
        Object.fromEntries(
            Object.entries(props.parameters)
                .filter(([, def]) => def.compute !== undefined)
                .map(([name, def]) => [name, def.compute!(t)]),
        );
    const initialDrawArgs: DrawArgs<T> = {
        t: 0,
        ...computeParamValues(0),
        ...Object.fromEntries(
            Object.entries(props.parameters)
                .filter(([, def]) => def.compute === undefined)
                .map(([name, def]) => [name, def.default !== undefined ? def.default : def.min]),
        ),
    } as DrawArgs<T>;
    const drawArgs = useRef<DrawArgs<T>>(initialDrawArgs);
    const lastDrawArgs = useRef<DrawArgs<T> | null>(null);
    const requestAnimationRef = useRef(0);
    const prevWindowTimeRef = useRef<null | number>(null);
    const frameTimes = useRef<number[]>([]); // Record how long frames are taking to draw for fps computations.
    const [fps, setFps] = useState(0.0);
    const [drawArgsUI, setDrawArgsUI] = useState<DrawArgs<T>>(initialDrawArgs);
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

    const resizeCanvas = useDebouncedCallback(() => {
        if (canvasElement.current === undefined) {
            return;
        }
        if (canvasElement.current.width == canvasDims.width && canvasElement.current.height == canvasDims.height) {
            return;
        }
        canvasElement.current.width = canvasDims.width;
        canvasElement.current.height = canvasDims.height;
        lastDrawArgs.current = null;
        setDrawFn(() => props.makeDrawFn(canvasElement.current!));
    }, 500);

    useEffect(() => {
        resizeCanvas();
    }, [canvasDims]);

    const pixelRatio = props.pixelRatio || window.devicePixelRatio;

    const setParam = (value: number, param: { name: string; def: ParameterDef }): void => {
        if (param.def.compute || controlMode == 'user') {
            setDrawArgsUI((old) => {
                return {
                    ...old,
                    ...Object.fromEntries([[param.name, value]]),
                };
            });
        } else {
            (drawArgs.current as any)[param.name] = value;
        }
    };

    const timeParameterDef: ParameterDef = {
        compute: (t) => t,
        default: 0.0,
        min: 0.0,
        max: props.duration,
        step: 0.01,
    };

    return (
        <IconContext.Provider value={{ style: { verticalAlign: 'middle', display: 'inline' } }}>
            <div className="flex flex-row flex-wrap gap-4 ">
                {/* canvas */}
                <div>
                    <div className="w-48"></div>
                    <div>
                        <canvas
                            width={props.initialCanvasWidth}
                            height={props.initialCanvasHeight}
                            style={{
                                width: canvasDims.width / pixelRatio,
                                height: canvasDims.height / pixelRatio,
                                backgroundColor: '#000000',
                            }}
                            ref={setupCanvas}
                        />
                    </div>
                </div>
                {/* controls */}
                <div className="flex h-full w-full flex-col gap-2 py-4" style={{ maxWidth: '512px' }}>
                    <div className="flex flex-row items-baseline gap-4">
                        <div className="flex flex-row gap-1">
                            <CanvasDimControls canvasDims={canvasDims} setCanvasDims={setCanvasDims} />
                        </div>
                        <div className="flex-grow"></div>
                        {controlMode != 'recording' ? (
                            <button
                                className="rounded bg-dark px-2 py-1 text-light hover:bg-dark-600 disabled:text-neutral-400 disabled:hover:bg-dark"
                                onClick={() => onClickRecord()}
                            >
                                export
                            </button>
                        ) : (
                            <button
                                className="rounded bg-dark px-2 py-1 text-light hover:bg-dark-600 "
                                onClick={() => onClickCancelRecord()}
                            >
                                cancel
                            </button>
                        )}
                        <p className={'w-20 ' + (controlMode == 'playing' ? 'text-light' : 'text-neutral-400')}>
                            {fps.toFixed(1)} fps
                        </p>
                    </div>
                    <div className="mt-4 grid grid-cols-9 gap-2">
                        <ParamController
                            name="t"
                            def={timeParameterDef}
                            value={drawArgsUI.t}
                            onChange={(value) =>
                                setDrawArgsUI((old) => {
                                    return {
                                        ...old,
                                        t: value,
                                        ...computeParamValues(value),
                                    };
                                })
                            }
                            disabled={controlMode != 'user' || !enableTimeControl}
                        >
                            <div className="relative -top-1 col-span-2 flex flex-row justify-end pr-2 text-sm ">
                                <button
                                    className="rounded-l-md bg-dark px-2 text-light-200 hover:bg-dark-600 hover:text-light disabled:text-neutral-400 disabled:hover:text-neutral-400"
                                    onClick={() => onClickReset()}
                                    disabled={controlMode == 'recording'}
                                >
                                    <FaStepBackward />
                                </button>
                                <button
                                    className="rounded-r-md bg-dark  px-2 text-light-200 hover:bg-dark-600 hover:text-light disabled:text-neutral-400 disabled:hover:text-neutral-400"
                                    onClick={() => onClickPlayPause()}
                                    disabled={controlMode == 'recording'}
                                >
                                    {controlMode == 'playing' ? <FaPause /> : <FaPlay />}
                                </button>
                            </div>
                        </ParamController>
                        {Object.entries(props.parameters).map(([name, def]) => (
                            <ParamController
                                name={name}
                                def={def}
                                value={drawArgsUI[name as keyof DrawArgs<T>]}
                                disabled={def.compute !== undefined && controlMode != 'user'}
                                onChange={(value) => setParam(value, { name, def })}
                                key={name}
                            >
                                <div className="col-span-2 mt-1 pr-2 text-right text-sm">
                                    <p>{name}</p>
                                </div>
                            </ParamController>
                        ))}
                    </div>
                </div>
            </div>
        </IconContext.Provider>
    );
};

const CanvasDimControls = ({
    canvasDims,
    setCanvasDims,
}: {
    canvasDims: CanvasDims;
    setCanvasDims: React.Dispatch<React.SetStateAction<CanvasDims>>;
}) => {
    const updateCanvasHeight = useCallback(
        (value: string) => {
            const newHeight = Number(value);
            let newWidth = canvasDims.width;
            if (canvasDims.arLocked) {
                const ar = canvasDims.width / canvasDims.height;
                newWidth = Math.round(newHeight * ar);
            }
            setCanvasDims((old) => ({
                ...old,
                width: newWidth,
                height: newHeight,
            }));
        },
        [canvasDims],
    );

    const updateCanvasWidth = useCallback(
        (value: string) => {
            const newWidth = Number(value);
            let newHeight = canvasDims.height;
            if (canvasDims.arLocked) {
                const arInv = canvasDims.height / canvasDims.width;
                newHeight = Math.round(newWidth * arInv);
            }
            setCanvasDims((old) => ({
                ...old,
                width: newWidth,
                height: newHeight,
            }));
        },
        [canvasDims],
    );

    const toggleArLocked = useCallback(() => {
        setCanvasDims((old) => ({
            ...old,
            arLocked: !canvasDims.arLocked,
        }));
    }, [canvasDims]);

    return (
        <React.Fragment>
            <input
                type="number"
                step="1"
                className="w-20 appearance-none rounded bg-dark px-2 py-1"
                value={canvasDims.width}
                onChange={(e) => updateCanvasWidth(e.target.value)}
            />
            <p className="pt-1">&times;</p>
            <input
                type="number"
                step="1"
                className="w-20 appearance-none rounded bg-dark px-2 py-1"
                value={canvasDims.height}
                onChange={(e) => updateCanvasHeight(e.target.value)}
            />
            <button className="px-2 text-sm text-neutral-400 hover:text-light" onClick={() => toggleArLocked()}>
                {canvasDims.arLocked ? <FaLock /> : <FaLockOpen style={{ position: 'relative', left: '2px' }} />}
            </button>
        </React.Fragment>
    );
};

const ParamController = ({
    children,
    name,
    def,
    value,
    disabled,
    onChange,
}: {
    children: React.ReactNode;
    name: string;
    def: ParameterDef;
    value: number;
    disabled: boolean;
    onChange: (value: number) => void;
}) => {
    return (
        <React.Fragment key={name}>
            {children}
            <div className="col-span-5">
                <input
                    type="range"
                    min={def.min}
                    max={def.max}
                    value={value}
                    step={def.step || 0.01}
                    disabled={disabled}
                    className="h-2 w-full appearance-none rounded-lg bg-dark accent-pink"
                    onChange={(e) => onChange(Number(e.target.value))}
                />
            </div>
            <div className="col-span-2">
                <input
                    type="number"
                    min="0"
                    max={def.max}
                    value={value}
                    step={def.step || 0.01}
                    disabled={disabled}
                    className="ml-2 w-20 appearance-none rounded bg-dark px-2 py-1"
                    onChange={(e) => onChange(Number(e.target.value))}
                />
            </div>
        </React.Fragment>
    );
};

const areDrawArgsEqual = <T extends ParameterConfig>(args1: DrawArgs<T>, args2: DrawArgs<T>): boolean => {
    const keys = Object.keys(args1);
    for (const key of keys) {
        if (Math.abs(args1[key as keyof DrawArgs<T>] - args2[key as keyof DrawArgs<T>]) > 1e-5) {
            return false;
        }
    }
    return true;
};
