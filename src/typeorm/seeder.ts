import { readdirSync } from 'fs';
import { resolve } from 'path';

export type Seeder<TDataSource = unknown> = (ds: TDataSource) => Promise<void>;

export async function runSeeds<TDataSource>(ds: TDataSource, seedsDir: string): Promise<void> {
  const files = readdirSync(seedsDir)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
    .sort();

  for (const file of files) {
    const mod = require(resolve(seedsDir, file)) as { default: Seeder<TDataSource> };
    console.log(`seed: running ${file}`);
    await mod.default(ds);
    console.log(`seed: ${file} done`);
  }
}
