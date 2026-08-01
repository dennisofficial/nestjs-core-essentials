# @dltech/nestjs-core

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
