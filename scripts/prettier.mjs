#!/usr/bin/env node
/**
 * scripts/prettier.mjs
 * Wrapper to consistently run Prettier across pnpm monorepos.
 */

import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve file and directory paths
const __filenameLocal = fileURLToPath(import.meta.url)
const __dirnameLocal = path.dirname(__filenameLocal)
const repoRoot = path.resolve(__dirnameLocal)

// Create a scoped require to resolve Prettier from the monorepo root
const requireLocal = createRequire(import.meta.url)

let prettierBin
try {
  // ✅ Locate Prettier 3 binary path via Node’s resolver
  prettierBin = requireLocal.resolve('prettier/bin/prettier.cjs', {
    paths: [repoRoot],
  })
} catch {
  console.error('❌ Could not resolve Prettier binary. Try running: pnpm -w install')
  process.exit(1)
}

// Collect user-passed arguments (e.g. "--check ." or "--write .")
const args = [prettierBin, ...process.argv.slice(2)]

// Spawn Prettier as a child process
const result = spawnSync(process.execPath, args, {
  stdio: 'inherit',
  cwd: repoRoot,
  env: { ...process.env },
})

// Exit with the same status code as Prettier
process.exit(result.status ?? 1)
