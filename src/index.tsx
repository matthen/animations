import React from 'react';
import ReactDOM from 'react-dom/client';
import { Link, RouterProvider, createBrowserRouter } from 'react-router-dom';

import Hypocycloids from './animations/hypocycloids';
import './index.css';
import './index.css';

const animations = [
    {
        name: 'hypocycloids',
        component: Hypocycloids,
    },
];

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

const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <AnimationList />,
        },
        ...animations.map((animation) => {
            return {
                path: `/${animation.name}`,
                element: <animation.component />,
            };
        }),
    ],
    { basename: '/smoothstep' },
);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <div className="min-h-screen bg-darker p-4 text-light">
        <React.StrictMode>
            <RouterProvider router={router} />
        </React.StrictMode>
    </div>,
);
