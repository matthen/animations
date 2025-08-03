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

The Graphics library (`src/lib/graphics.ts`) provides a declarative approach to Canvas 2D drawing, inspired by Mathematica's `Graphics[]` system. Instead of imperatively calling canvas methods, you build a nested structure of graphics objects that automatically manage drawing context.

### Coordinate System

Graphics uses a mathematical coordinate system rather than pixel coordinates. You specify the drawing bounds with `xmin`, `xmax`, `ymin`, and `ymax` options, and the library automatically handles the canvas transformation. Coordinates work as expected mathematically:
- **X-axis**: increases left to right (like pixels)
- **Y-axis**: increases bottom to top (unlike pixels, which increase top to bottom)

For example, with bounds `{xmin: -1, xmax: 1, ymin: -1, ymax: 1}`, the point `[0, 0]` is at the center, `[1, 1]` is top-right, and `[-1, -1]` is bottom-left.

### Core Concept: DrawCommands and Nested Structure

Graphics uses `DrawCommand` functions organized in nested arrays. Each array level creates a new canvas context scope using `save()` and `restore()`, allowing transformations and style changes to be automatically contained within their scope.

```typescript
Graphics.draw(
    [
        // Set canvas context properties at root level (ctx.save() called automatically)
        Graphics.Set({ strokeStyle: 'white', fillStyle: 'red' }),
        Graphics.AbsoluteLineWidth(4),
        // Red-filled disk with white outline
        Graphics.Disk({ center: [0, 0], radius: 0.5, fill: true, edge: true }),
        [
            // New context scope (ctx.save() called) - inherits white stroke + red fill
            // Override fill to blue while keeping white stroke inherited from parent
            Graphics.Set({ fillStyle: 'blue' }),
            // Blue-filled square with inherited white outline
            Graphics.Polygon({
                pts: [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                ],
                edge: true,
                fill: true,
            }),
            [
                // Deeper context scope (nested ctx.save()) - inherits white stroke + blue fill
                // Add rotation transform + change fill to white for text
                Graphics.Rotate({ angle: -Math.PI / 4, center: [0, 0] }),
                Graphics.Set({ font: '0.25px monospace', fillStyle: 'white' }),
                Graphics.Text({ at: [0, 0], text: 'hello' }),
                // When this scope ends: ctx.restore() removes rotation + white text fill
            ],
            // Back in blue-fill scope: rotation gone, fillStyle blue, strokeStyle white
        ],
        // Back in root scope (ctx.restore() called): fillStyle red, strokeStyle white, no transforms
        [
            // New sibling scope (ctx.save() called) - inherits red fill + white stroke
            // Add translation transform
            Graphics.Translate({ offset: [-1, -1] }),
            // Red-filled square at translated position with white outline
            Graphics.Polygon({
                pts: [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                ],
                edge: true,
                fill: true,
            }),
            // When this scope ends: ctx.restore() removes translation
        ],
        // Back in root scope: original red fill + white stroke, no transforms
    ],
    {
        xmin: -1.1,
        xmax: 1.1,
        ymin: -1.1,
        ymax: 1.1,
    },
    ctx,
);
```

### Available Graphics Commands

**Shapes:**
- `Graphics.Disk()` - Circles and arcs with fill/edge options
- `Graphics.Polygon()` - Filled/outlined polygons from point arrays  
- `Graphics.Line()` - Polylines from point arrays
- `Graphics.Text()` - Text at specified coordinates

**Transformations:**
- `Graphics.Rotate()` - Rotate around a center point
- `Graphics.Translate()` - Translate by offset
- `Graphics.Scale()` - Scale around a center point

**Styling:**
- `Graphics.Set()` - Set canvas properties (colors, line width, etc.)
- `Graphics.AbsoluteLineWidth()` - Line width in pixels regardless of zoom
