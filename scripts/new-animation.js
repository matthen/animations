#!/usr/bin/env node

/**
 * Interactive Animation Generator
 *
 * Creates new animation components with templates for either:
 * - Shader animations (WebGL/GLSL)
 * - 2D Canvas animations (using Graphics library)
 *
 * Usage:
 *   pnpm new-animation                           # Interactive mode
 *   pnpm new-animation --name "My Animation" --type shader --params param1,param2
 *
 * The script will prompt for animation name, type, and parameters,
 * then generate all necessary files with proper templates.
 */

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const inquirer = require('inquirer').default;

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
        .map((param) => `        ${param}: { min: 0, max: 1, default: 0.5 },`)
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
        .map((param) => `        ${param}: { min: 0, max: 1, default: 0.5 },`)
        .join('\n');
    const drawArgsType = `{ ${parameters.join(', ')} }`;
    const parameterComments = parameters.join(', ');

    template = template.replace(/{{PASCAL_NAME}}/g, pascalName);
    template = template.replace('{{PARAMETER_DEFINITIONS}}', parameterDefinitions);
    template = template.replace('{{DRAW_ARGS_TYPE}}', drawArgsType);
    template = template.replace('{{PARAMETER_COMMENTS}}', parameterComments);
    
    return template;
}

async function createAnimation({ name, type, params }) {
    // Sanitize inputs
    const finalName = name.replace(/[-_]/g, ' ');
    const isShader = type === 'shader';
    const parameters = params || [];

    // Validate parameter names
    for (const param of parameters) {
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(param)) {
            throw new Error(`Parameter name "${param}" must be alphanumeric and start with a letter`);
        }
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

    // Create animation file
    const animationFile = path.join(animationDir, `${camelName}.tsx`);
    if (fs.existsSync(animationFile)) {
        throw new Error(`File ${camelName}.tsx already exists`);
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
            throw new Error(`File ${camelName}.glsl already exists`);
        }
        
        const shaderContent = createShaderTemplate(finalName, parameters);
        fs.writeFileSync(shaderFile, shaderContent);
        console.log(`✅ Created ${shaderFile}`);
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
}

async function promptForMissing(options) {
    const questions = [];
    
    // Prompt for name if not provided
    if (!options.name) {
        questions.push({
            type: 'input',
            name: 'name',
            message: 'Animation name:',
            default: () => {
                const randomHash = Math.random().toString(36).substring(2, 6);
                return `new animation ${randomHash}`;
            },
        });
    }
    
    // Prompt for type if not provided
    if (!options.type) {
        questions.push({
            type: 'list',
            name: 'type',
            message: 'Select animation type:',
            choices: [
                { name: 'Shader animation (WebGL/GLSL)', value: 'shader' },
                { name: '2D Canvas animation', value: '2d' },
            ],
        });
    }
    
    // Prompt for params if not provided
    if (!options.params) {
        questions.push({
            type: 'input',
            name: 'paramInput',
            message: 'Parameters (comma-separated, or press Enter for none):',
            default: '',
        });
    }
    
    // Only prompt if there are questions to ask
    if (questions.length > 0) {
        console.log('🎨 Animation Generator');
        console.log('===================\n');
        
        const answers = await inquirer.prompt(questions);
        
        // Merge answers with existing options
        return {
            name: options.name || answers.name,
            type: options.type || answers.type,
            params: options.params || (answers.paramInput 
                ? answers.paramInput.split(',').map(p => p.trim()).filter(p => p)
                : []),
        };
    }
    
    return options;
}

async function main() {
    const program = new Command();
    
    program
        .name('new-animation')
        .description('Create new animation components')
        .option('-n, --name <name>', 'animation name')
        .option('-t, --type <type>', 'animation type (shader, 2d, canvas, 1, 2)')
        .option('-p, --params <params>', 'comma-separated parameter names')
        .parse();

    let options = program.opts();
    
    // Parse and validate type if provided
    if (options.type) {
        const typeMap = {
            'shader': 'shader',
            '1': 'shader',
            '2d': '2d',
            'canvas': '2d',
            '2': '2d'
        };
        
        const type = typeMap[options.type.toLowerCase()];
        if (!type) {
            console.error('❌ Invalid type. Use "shader", "2d", "canvas", "1", or "2"');
            process.exit(1);
        }
        options.type = type;
    }
    
    // Parse parameters if provided
    if (options.params) {
        options.params = options.params.split(',').map(p => p.trim()).filter(p => p);
    }
    
    // Prompt for any missing options
    options = await promptForMissing(options);
    
    // Check for existing files and handle overwrite
    const camelName = toCamelCase(options.name);
    const animationFile = path.join(__dirname, '..', 'src', 'animations', `${camelName}.tsx`);
    const shaderFile = path.join(__dirname, '..', 'src', 'animations', 'shaders', `${camelName}.glsl`);
    
    const existingFiles = [];
    if (fs.existsSync(animationFile)) existingFiles.push(`${camelName}.tsx`);
    if (options.type === 'shader' && fs.existsSync(shaderFile)) existingFiles.push(`${camelName}.glsl`);
    
    if (existingFiles.length > 0) {
        const { overwrite } = await inquirer.prompt([{
            type: 'confirm',
            name: 'overwrite',
            message: `Files already exist: ${existingFiles.join(', ')}. Overwrite?`,
            default: false,
        }]);
        
        if (!overwrite) {
            console.log('❌ Cancelled');
            process.exit(0);
        }
        
        // Remove existing files
        existingFiles.forEach(file => {
            const fullPath = file.endsWith('.glsl') ? shaderFile : animationFile;
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        });
    }
    
    // Create the animation
    try {
        await createAnimation({
            name: options.name,
            type: options.type,
            params: options.params,
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main().catch(console.error);