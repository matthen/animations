# New Animation Skill

This skill helps create new animations using the `pnpm new-animation` command.

## Instructions

When invoked, you should create a new animation by:

1. Gathering required information from the user if not already provided:
   - **Animation name**: A descriptive name for the animation
   - **Animation type**: Either "shader" (WebGL/GLSL) or "2d" (Canvas 2D)
   - **Parameters** (optional): Comma-separated list of parameter names the animation will use

2. If any required information is missing, use the `AskUserQuestion` tool to ask the user:
   - For animation name: Ask "What would you like to name this animation?"
   - For animation type: Provide options for "Shader (WebGL/GLSL)" or "2D Canvas"
   - For parameters: Ask if they want to add parameters, and if so, what they should be named

3. Once you have the information, run the command:
   ```bash
   # With parameters:
   pnpm new-animation --name "Animation Name" --type shader --params param1,param2,param3

   # Without parameters:
   pnpm new-animation --name "Animation Name" --type 2d
   ```

4. After the command completes:
   - Inform the user where the files were created
   - Mention the TODO comments in the generated files that need implementation
   - For shader animations, note that both a TypeScript component and GLSL shader file were created
   - Suggest next steps (implementing the animation logic, running `pnpm start` to preview, etc.)

## Type Options

- Shader types: `shader` or `1`
- 2D Canvas types: `2d`, `canvas`, or `2`

## Examples

- Shader with parameters: `pnpm new-animation --name "Wave Pattern" --type shader --params amplitude,frequency,speed`
- 2D Canvas with parameters: `pnpm new-animation --name "Circle Dance" --type 2d --params radius,speed`
- Minimal shader: `pnpm new-animation --name "Simple Gradient" --type shader`
