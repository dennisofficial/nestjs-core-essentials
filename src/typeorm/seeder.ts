import { readdirSync } from 'fs';
import { resolve } from 'path';

import type { DataSource } from 'typeorm';

/**
 * A seed function that receives an initialized DataSource and performs
 * idempotent data operations against it.
 *
 * Each seed file should export one of these as its default export using
 * `satisfies` for type safety without losing inference:
 *
 * @example
 * ```typescript
 * import type { Seeder } from '@dltech/nestjs-core';
 *
 * export default (async (ds) => {
 *   const repo = ds.getRepository(User);
 *   if (await repo.findOne({ where: { email: 'dev@example.com' } })) return;
 *   await repo.save(repo.create({ email: 'dev@example.com' }));
 * }) satisfies Seeder;
 * ```
 */
export type Seeder = (ds: DataSource) => Promise<void>;

/**
 * Discovers, sorts, and executes all seed files in `seedsDir`.
 *
 * Files are sorted alphabetically so numeric prefixes (001-, 002-, …)
 * control execution order. Each file must export a {@link Seeder} as its
 * default export. Seeds must be idempotent — safe to run more than once.
 *
 * @param ds - An already-initialized TypeORM DataSource.
 * @param seedsDir - Absolute path to the directory containing seed files.
 *
 * @example
 * ```typescript
 * // cli/seed-runner.ts
 * import { resolve } from 'path';
 * import { runSeeds } from '@dltech/nestjs-core';
 * import { AppDataSource } from './data-source';
 *
 * await AppDataSource.initialize();
 * try {
 *   await runSeeds(AppDataSource, resolve(__dirname, '../seeds'));
 * } finally {
 *   await AppDataSource.destroy();
 * }
 * ```
 */
export async function runSeeds(ds: DataSource, seedsDir: string): Promise<void> {
  const files = readdirSync(seedsDir)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
    .sort();

  for (const file of files) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(resolve(seedsDir, file)) as { default: Seeder };
    console.log(`seed: running ${file}`);
    await mod.default(ds);
    console.log(`seed: ${file} done`);
  }
}
