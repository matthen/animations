# matthen/animations

[![deploy-pages](https://github.com/matthen/animations/actions/workflows/deploy-pages.yaml/badge.svg?branch=main)](https://github.com/matthen/animations/actions/workflows/deploy-pages.yaml)

view live animations at: [matthen.github.io/animations](https://matthen.github.io/animations/).

This is a collection of mathematical animations, written as small React components.

-   [animations](src/animations) - code for each animation
-   [lib/Animation.tsx](src/lib/Animation.tsx) - react component for rendering and exporting animations
-   [lib/graphics.ts](src/lib/graphics.ts) - library to simplify drawing to 2d canvas

## Creating an animation

Use the interactive animation generator:

```bash
pnpm new-animation
```

This will prompt you to:
1. Choose animation name
2. Select type (shader or 2D canvas)
3. Define parameters (all default to 0-1 range)

The script generates all necessary files with proper templates and TODO comments to guide implementation.

## Using `Graphics`

Todo
