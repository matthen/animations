# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based mathematical animations project that creates interactive visualizations. Each animation is implemented as a React component with parameter controls, playback, and export functionality.

## Key Commands

### Development
- `pnpm install` - Install dependencies
- `pnpm start` - Start development server on localhost:3000
- `pnpm build` - Build for production
- `pnpm new-animation` - Interactive script to create new animations

### Package Manager
This project uses **pnpm** (not npm). Always use `pnpm` commands.

## Architecture

### Core Components
- **Animation Component** (`src/lib/Animation.tsx`): Main wrapper providing playback controls, parameter sliders, canvas resizing, and export functionality
- **Graphics Library** (`src/lib/graphics.ts`): Canvas 2D drawing utilities with coordinate system management and drawing primitives
  - **IMPORTANT**: When adding or editing functions in `graphics.ts`, always update the "Available Graphics Commands" section in `README.md` to keep the documentation in sync
- **Utils** (`src/lib/utils.ts`): Shared utilities including transition functions

### Animation Structure
Each animation in `src/animations/` follows this pattern:
- Defines parameters with min/max values and optional computed values over time
- Implements a `MakeDrawFn` that returns a drawing function
- Uses either Canvas 2D (via Graphics library) or WebGL (via Three.js/shaders)
- Exports as React component wrapped with Animation component

### Shader Support
- GLSL shaders in `src/animations/shaders/` are imported as strings via custom webpack config
- Use `glsl-pipeline` for WebGL shader management
- Three.js for WebGL rendering when needed

### Styling
- Uses Tailwind CSS with Dracula theme
- Custom configuration in `tailwind.config.js`
- Prettier with import sorting and Tailwind class sorting

### Parameter System
Parameters can be:
- Static: User-controlled sliders
- Computed: Automatically animated over time using transition functions
- Time parameter: Built-in animation time control

### Export Functionality
- Uses CCapture.js for video export (WebM format, 60fps)
- CCapture.js loaded from public directory, not npm

## Creating New Animations

Use the interactive script: `pnpm new-animation`

The script will prompt for:
1. Animation name
2. Type (shader or 2D canvas)
3. Parameter names (all default to 0-1 range)

It generates:
- TypeScript animation component in `src/animations/`
- GLSL shader file (for shader animations) in `src/animations/shaders/`
- Properly configured uniforms and parameter bindings
- Template code with TODO comments for implementation

## File Structure
- `src/animations/` - Individual animation components
- `src/animations/shaders/` - GLSL shader files
- `src/lib/` - Core libraries (Animation, Graphics, Utils)
- `scripts/` - Development utilities (animation generator)
- `public/images/` - Static image assets
- Configuration files use standard React/TypeScript setup with custom webpack override for GLSL loading
