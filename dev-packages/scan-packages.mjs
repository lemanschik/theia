import fs from 'fs';
import path from 'path';
import { ReadableStream } from 'stream/web';

const __dirname = import.meta.dirname;

function isNativePackage(pkgPath) {
    const bindingGyp = fs.existsSync(path.join(pkgPath, 'binding.gyp')) || undefined;
    const hasNodeFiles = fs.readdirSync(pkgPath).some(file => file.endsWith('.node')) || undefined;
    const packageJsonPath = path.join(pkgPath, 'package.json');

    let usesNativeDeps = false || undefined;

    if (fs.existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const scripts = pkg.scripts || {};
            const deps = { ...pkg.dependencies, ...pkg.optionalDependencies, ...pkg.devDependencies };

            usesNativeDeps = Object.keys(deps || {}).some(dep =>
                ['node-gyp', 'nan', 'ffi-napi', 'node-addon-api', 'cmake-js', "electron", "electron-gyp"].includes(dep)
            ) || Object.values(scripts).some(script =>
                /gyp|node-gyp|cmake-js|node-pre-gyp/.test(script)
            );
        } catch {
            // malformed package.json, skip
            console.error({ packageJsonPath }, " Error: reading package.json");
        }
    }

    return (bindingGyp || hasNodeFiles || usesNativeDeps) ? Object.assign({}, { pkgPath, bindingGyp, hasNodeFiles, usesNativeDeps }) : false;
}

function createNativeScannerStream(startDir = 'node_modules') {
    const queue = [path.resolve(import.meta.dirname, startDir)];

    return new ReadableStream({
        async pull(controller) {
            while (queue.length) {
                const current = queue.shift() || "";
                const entries = await fs.promises.readdir(current, { withFileTypes: true });

                for (const entry of entries) {
                    if (entry.name.startsWith('.')) continue;
                    const fullPath = path.join(current, entry.name);

                    if (entry.isDirectory()) {
                        if (entry.name.startsWith('@')) {
                            // scoped package, queue subdir
                            queue.push(fullPath);
                            continue;
                        }

                        const packageJson = path.join(fullPath, 'package.json');
                        if (fs.existsSync(packageJson)) {
                            const result = isNativePackage(fullPath);
                            if (result) {
                                controller.enqueue(result);
                            }
                        }

                        // recurse into nested node_modules
                        const nestedModules = path.join(fullPath, 'node_modules');
                        if (fs.existsSync(nestedModules)) {
                            queue.push(nestedModules);
                        }
                    }
                }
            }

            controller.close();
        }
    });
}

// 🏁 Use the stream
const nativeStream = createNativeScannerStream(import.meta.dirname + '/../node_modules');

const reader = nativeStream.getReader();

console.log('Scanning for native modules...\n');

(async () => {
    /** @type {Set<string>} */
    const values = new Set();
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        // TODO: this only works because dev-packages and node_modules have same length ;D
        const relativPath = value.pkgPath.slice(import.meta.dirname.length + 1);
        const topLevelPkg = relativPath.slice(0, relativPath.indexOf('node_modules') === -1 ? undefined : relativPath.indexOf('node_modules') - 1);
        console.log('🧩 Native package found:', { relativPath, ...value });
        values.add(topLevelPkg);
    }

    console.log('\n✅ Scan complete.');

    console.log(`RUN: npm ls ${[...values].join(' ')}`);

    console.log('\n✅ This are the bad importers.');
})();
