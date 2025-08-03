#!/usr/bin/env node

/**
 * Interactive Animation Generator
 *
 * Creates new animation components with templates for either:
 * - Shader animations (WebGL/GLSL)
 * - 2D Canvas animations (using Graphics library)
 *
 * Usage:
 *   pnpm new-animation
 *
 * The script will prompt for animation name, type, and parameters,
 * then generate all necessary files with proper templates.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function toPascalCase(str) {
    return str.replace(/(?:^|\s)(\w)/g, (_, char) => char.toUpperCase()).replace(/\s/g, '');
}

function toCamelCase(str) {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function createShaderTemplate(name, parameters) {
    const templatePath = path.join(__dirname, 'templates', 'shader.glsl');
    let template = fs.readFileSync(templatePath, 'utf8');
    
    const uniformDeclarations = parameters.map((param) => `uniform float u_${param};`).join('\n');
    const uniformComments = parameters.length > 0 ? `, ${parameters.map((p) => `u_${p}`).join(', ')}` : '';
    
    template = template.replace('{{UNIFORM_DECLARATIONS}}', uniformDeclarations);
    template = template.replace('{{UNIFORM_COMMENTS}}', uniformComments);
    
    return template;
}

function createShaderAnimationTemplate(name, parameters) {
    const templatePath = path.join(__dirname, 'templates', 'shader-animation.tsx');
    let template = fs.readFileSync(templatePath, 'utf8');
    
    const pascalName = toPascalCase(name);
    const camelName = toCamelCase(name);

    const parameterDefinitions = parameters
        .map((param) => `        { name: '${param}', minValue: 0, maxValue: 1, defaultValue: 0.5 },`)
        .join('\n');
    const uniformsObject = `{ u_t: { value: 0 }${parameters.length > 0 ? ', ' : ''}${parameters
        .map((p) => `u_${p}: { value: 0 }`)
        .join(', ')} }`;
    const uniformAssignments = parameters
        .map((param) => `            pipeline.uniforms.u_${param}.value = ${param};`)
        .join('\n');
    const drawArgsType = `{ t${parameters.length > 0 ? ', ' : ''}${parameters.join(', ')} }`;

    template = template.replace(/{{PASCAL_NAME}}/g, pascalName);
    template = template.replace(/{{CAMEL_NAME}}/g, camelName);
    template = template.replace('{{PARAMETER_DEFINITIONS}}', parameterDefinitions);
    template = template.replace('{{UNIFORMS_OBJECT}}', uniformsObject);
    template = template.replace('{{UNIFORM_ASSIGNMENTS}}', uniformAssignments);
    template = template.replace('{{DRAW_ARGS_TYPE}}', drawArgsType);
    
    return template;
}

function create2DAnimationTemplate(name, parameters) {
    const templatePath = path.join(__dirname, 'templates', '2d-animation.tsx');
    let template = fs.readFileSync(templatePath, 'utf8');
    
    const pascalName = toPascalCase(name);

    const parameterDefinitions = parameters
        .map((param) => `        { name: '${param}', minValue: 0, maxValue: 1, defaultValue: 0.5 },`)
        .join('\n');
    const drawArgsType = `{ ${parameters.join(', ')} }`;
    const parameterComments = parameters.join(', ');

    template = template.replace(/{{PASCAL_NAME}}/g, pascalName);
    template = template.replace('{{PARAMETER_DEFINITIONS}}', parameterDefinitions);
    template = template.replace('{{DRAW_ARGS_TYPE}}', drawArgsType);
    template = template.replace('{{PARAMETER_COMMENTS}}', parameterComments);
    
    return template;
}

async function main() {
    console.log('🎨 Animation Generator');
    console.log('===================\n');

    // Get animation name
    const randomHash = Math.random().toString(36).substring(2, 6);
    const defaultName = `new animation ${randomHash}`;
    const name = await question(`Animation name (${defaultName}): `);
    // Convert dashes and underscores to spaces to ensure valid TypeScript identifiers
    const sanitizedName = (name.trim() || defaultName).replace(/[-_]/g, ' ');
    const finalName = sanitizedName;

    // Get animation type
    console.log('\nSelect animation type:');
    console.log('1. Shader animation (WebGL/GLSL)');
    console.log('2. 2D Canvas animation');
    const typeChoice = await question('Enter choice (1 or 2): ');

    if (!['1', '2'].includes(typeChoice)) {
        console.log('❌ Invalid choice');
        rl.close();
        return;
    }

    const isShader = typeChoice === '1';

    // Get parameters
    console.log('\nParameters (press Enter with empty name to finish):');
    const parameters = [];
    let paramIndex = 1;

    while (true) {
        const paramName = await question(`Parameter ${paramIndex} name: `);
        if (!paramName.trim()) break;

        // Validate parameter name
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(paramName)) {
            console.log('❌ Parameter name must be alphanumeric and start with a letter');
            continue;
        }

        parameters.push(paramName.trim());
        paramIndex++;
    }

    console.log(
        `\n📝 Creating ${isShader ? 'shader' : '2D canvas'} animation "${finalName}" with parameters: [${
            parameters.join(', ') || 'none'
        }]`,
    );

    // Create files
    const pascalName = toPascalCase(finalName);
    const camelName = toCamelCase(finalName);
    const animationDir = path.join(__dirname, '..', 'src', 'animations');
    const shaderDir = path.join(animationDir, 'shaders');

    try {
        // Create animation file
        const animationFile = path.join(animationDir, `${camelName}.tsx`);
        if (fs.existsSync(animationFile)) {
            const overwrite = await question(`⚠️  File ${camelName}.tsx already exists. Overwrite? (y/N): `);
            if (overwrite.toLowerCase() !== 'y') {
                console.log('❌ Cancelled');
                rl.close();
                return;
            }
        }

        const animationContent = isShader
            ? createShaderAnimationTemplate(finalName, parameters)
            : create2DAnimationTemplate(finalName, parameters);

        fs.writeFileSync(animationFile, animationContent);
        console.log(`✅ Created ${animationFile}`);

        // Create shader file if needed
        if (isShader) {
            const shaderFile = path.join(shaderDir, `${camelName}.glsl`);
            if (fs.existsSync(shaderFile)) {
                const overwrite = await question(`⚠️  File ${camelName}.glsl already exists. Overwrite? (y/N): `);
                if (overwrite.toLowerCase() === 'y') {
                    const shaderContent = createShaderTemplate(finalName, parameters);
                    fs.writeFileSync(shaderFile, shaderContent);
                    console.log(`✅ Created ${shaderFile}`);
                }
            } else {
                const shaderContent = createShaderTemplate(finalName, parameters);
                fs.writeFileSync(shaderFile, shaderContent);
                console.log(`✅ Created ${shaderFile}`);
            }
        }

        console.log('\n🎉 Animation created successfully!');
        console.log('\nNext steps:');
        console.log(`1. Import and add ${pascalName} to your animation list`);
        console.log(
            `2. ${
                isShader
                    ? 'Edit the shader logic in the .glsl file'
                    : 'Add your drawing commands to the Graphics.draw array'
            }`,
        );
        console.log('3. Customize parameters and add transition functions if needed');
        console.log('4. Run `pnpm start` to see your animation');
    } catch (error) {
        console.error('❌ Error creating files:', error.message);
    }

    rl.close();
}

main().catch(console.error);
