import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const databasePath = resolve('prisma/e2e.db');
if (existsSync(databasePath)) rmSync(databasePath);
const environment = { ...process.env, DATABASE_URL: 'file:./prisma/e2e.db', ADMIN_BOOTSTRAP_PASSWORD: 'e2e-curator-password' };
execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--url', environment.DATABASE_URL], { cwd: process.cwd(), env: environment, stdio: 'inherit' });
execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'prisma/seed.ts'], { cwd: process.cwd(), env: environment, stdio: 'inherit' });
