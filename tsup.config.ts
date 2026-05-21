import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';
import { join } from 'path';
import esbuildPluginTsc from 'esbuild-plugin-tsc';

// Read package.json to auto-detect externals
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));

const external = [
  ...Object.keys(packageJson.peerDependencies || {}),
  ...Object.keys(packageJson.devDependencies || {}).filter(
    (dep) => !dep.startsWith('@types/') && !['typescript', 'tsup'].includes(dep),
  ),
];

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  external,
  treeshake: true,
  minify: false,
  target: 'es2023',
  // Injects a `require` shim into the ESM build so that runSeeds (which uses
  // require() for CJS-compatible dynamic seed loading) compiles without errors.
  shims: true,
  // Delegate TypeScript compilation (including decorator + metadata emit) to tsc.
  // esbuild's native decorator/metadata emit is inconsistent across platforms
  // (macOS host vs Alpine Docker produced different output for design:paramtypes),
  // breaking NestJS DI for @Injectable() classes whose constructor params rely on
  // Reflect.getMetadata. Routing the TS step through real tsc fixes this — esbuild
  // still bundles + tree-shakes, but the emitted code has correct decorator metadata.
  esbuildPlugins: [
    esbuildPluginTsc({
      tsconfigPath: join(__dirname, 'tsconfig.json'),
      force: true,
    }),
  ],
});
