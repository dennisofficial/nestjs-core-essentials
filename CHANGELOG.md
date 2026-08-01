# @dltech/nestjs-core

## 1.0.1

### Patch Changes

- Fix `design:paramtypes` missing from the published build, which made every provider with constructor-injected dependencies unresolvable by Nest (e.g. `LoggerInterceptor` failed with `Nest can't resolve dependencies of the LoggerInterceptor (?, +, pretty-ms)`).

  `tsup` only honours `emitDecoratorMetadata` when it can resolve `@swc/core`, and silently degrades to a warning — not a failure — when it can't. `@swc/core` wasn't a dependency, so the flag did nothing and the build shipped zero `design:paramtypes` despite `experimentalDecorators`/`emitDecoratorMetadata` both being on in `tsconfig.json`.

  Added `@swc/core` as a devDependency (build-time only, not shipped to consumers). No API changes — only the build output is different.

## 1.0.0

### Major Changes

- First public release.

  Previously consumed as `@workspace/nestjs-core` through a git submodule. The package now
  ships compiled type declarations from `dist` rather than pointing consumers at its
  TypeScript sources, and releases through CI with npm provenance.

  Two dependencies that only ever resolved because the consuming workspace hoisted them are
  now declared properly: `class-validator` moves to `dependencies`, since `isDefined` is an
  unconditional top-level import in `create-module.decorator.ts` and reaching it through the
  decorators barrel would otherwise throw on a clean install; and `mongoose` joins the
  optional peers alongside `@nestjs/mongoose`, since `CreateModule`'s exported options type
  refers to it.
