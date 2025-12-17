const Path = require('path');
const Chalk = require('chalk');
const FileSystem = require('fs');
const Vite = require('vite');
const compileTs = require('./private/tsc');

function buildRenderer() {
    return Vite.build({
        configFile: Path.join(__dirname, '..', 'vite.config.js'),
        base: './',
        mode: 'production'
    });
}

function buildMain() {
    const mainPath = Path.join(__dirname, '..', 'src', 'main');
    return compileTs(mainPath);
}

function copyStaticFiles() {
    const srcStaticPath = Path.join(__dirname, '..', 'src', 'main', 'static');
    const destStaticPath = Path.join(__dirname, '..', 'build', 'main', 'static');

    if (FileSystem.existsSync(srcStaticPath)) {
        FileSystem.cpSync(srcStaticPath, destStaticPath, { recursive: true });
    }
}

FileSystem.rmSync(Path.join(__dirname, '..', 'build'), {
    recursive: true,
    force: true,
})

console.log(Chalk.blueBright('Transpiling renderer & main...'));

Promise.allSettled([
    buildRenderer(),
    buildMain(),
]).then(() => {
    copyStaticFiles();
    console.log(Chalk.greenBright('Renderer & main successfully transpiled! (ready to be built with electron-builder)'));
});
