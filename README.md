# @workspace/nestjs-core

Shared NestJS utilities used across all Cubix backend services.

---

## Modules

- [EnvModule / BaseEnvService](#env)
- [LoggerModule](#logger)
- [Decorators](#decorators)
- [TypeORM — Seeder](#typeorm--seeder)

---

## Env

Type-safe environment configuration backed by `@nestjs/config`.

```typescript
// env.service.ts
@Injectable()
export class EnvService extends BaseEnvService<IEnvConfig> {}

// app.module.ts
EnvModule.forRoot({ envService: EnvService, validationSchema: envConfigValidation })
```

`BaseEnvService<T>` wraps `ConfigService` so that `envService.get('KEY')` is
fully typed against your `IEnvConfig` interface with no casting required.

---

## Logger

Drop-in structured logger module.

```typescript
// app.module.ts
import { LoggerModule } from '@workspace/nestjs-core';

@Module({ imports: [LoggerModule] })
export class AppModule {}
```

---

## Decorators

### `@CreateModule`

Convenience decorator that applies common module-level defaults.

```typescript
@CreateModule({ imports: [...] })
export class AppModule {}
```

### `@SseGenerator`

Helper decorator for Server-Sent Events endpoints.

---

## TypeORM — Seeder

A file-based, idempotent seeding system for local development. Mirrors the
TypeORM migrations pattern: numbered files, sorted alphabetically, each run
in order.

### Setup (per project)

**1. Add the `db:seed` script to `package.json`:**

```json
"db:seed": "cross-env NODE_ENV=development pnpm env:inject -- pnpm db:ts-node cli/seed-runner.ts",
"db:recreate": "pnpm db:schema:drop && pnpm db:migrate && pnpm db:seed"
```

**2. Create `cli/seed-runner.ts` — the entry point:**

```typescript
import { resolve } from 'path';
import { runSeeds } from '@workspace/nestjs-core';
import { AppDataSource } from './data-source';

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    console.log('seed: NODE_ENV is not "development" — exiting safely');
    process.exit(0);
  }

  await AppDataSource.initialize();
  try {
    await runSeeds(AppDataSource, resolve(__dirname, '../seeds'));
    console.log('seed: all seeds complete');
  } finally {
    await AppDataSource.destroy();
  }
}

void main();
```

**3. Create numbered seed files in `seeds/`:**

```typescript
// seeds/001-dev-user.ts
import type { Seeder } from '@workspace/nestjs-core';

export default (async (ds) => {
  const repo = ds.getRepository(User);
  if (await repo.findOne({ where: { email: 'dev@example.com' } })) return;
  await repo.save(repo.create({ email: 'dev@example.com', ... }));
}) satisfies Seeder;
```

### How it works

| Concern | Detail |
|---|---|
| **Ordering** | Files sorted alphabetically — use `001-`, `002-`, … prefixes |
| **Idempotency** | Each seed must guard against duplicate data (`findOne` → skip) |
| **Safety** | `seed-runner.ts` exits with code 0 if `NODE_ENV !== 'development'` |
| **DataSource** | Caller initializes and destroys — `runSeeds` only runs the files |

### API

```typescript
// Type for a seed file's default export
type Seeder = (ds: DataSource) => Promise<void>;

// Discovers and runs all .ts / .js files in seedsDir, sorted alphabetically
function runSeeds(ds: DataSource, seedsDir: string): Promise<void>;
```
