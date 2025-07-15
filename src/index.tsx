import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { FaArrowLeft } from 'react-icons/fa';
import { Link, RouterProvider, createHashRouter } from 'react-router-dom';

import './index.css';

// Dynamically import all animation components from the 'animations' directory.
const animationsContext = require.context('./animations', false, /\.(t|j)sx?$/);

// Construct the animations list from file names
const animations = animationsContext
    .keys()
    .filter((file) => !file.startsWith('animations/'))
    .map((file) => {
        const name = file.replace('./', '').replace(/\.tsx?$/, '');
        const component = React.lazy(() => import(`./animations/${name}`));
        return { name, component };
    });

const AnimationList = () => {
    return (
        <div className="ml-16 mt-16 max-w-lg bg-darker">
            <h1 className="text-xl font-bold">Animations</h1>
            <ul className="list-inside list-disc pt-2 ">
                {animations.map((animation) => (
                    <li key={animation.name}>
                        <Link to={`/${animation.name}`} className="text-pink hover:text-pink-200 hover:underline">
                            {animation.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ViewAnimation = ({ children }: { children: ReactNode }) => {
    return (
        <div>
            <p className="mb-2">
                <Link to="/" className="text-sm text-neutral-400 hover:text-white">
                    <FaArrowLeft className="mb-1 mr-1 inline " /> all animations
                </Link>
            </p>
            {children}
        </div>
    );
};

const router = createHashRouter([
    {
        path: '/',
        element: <AnimationList />,
    },
    ...animations.map((animation) => {
        return {
            path: `/${animation.name}`,
            element: (
                <ViewAnimation>
                    <React.Suspense fallback={<div>Loading...</div>}>
                        <animation.component />
                    </React.Suspense>
                </ViewAnimation>
            ),
        };
    }),
]);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <div className="min-h-screen bg-darker p-4 text-light">
        <React.StrictMode>
            <RouterProvider router={router} />
        </React.StrictMode>
    </div>,
);
