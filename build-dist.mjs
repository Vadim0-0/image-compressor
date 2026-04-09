import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const sourceDir = resolve('.output/public')
const targetDir = resolve('dist')

const sourceStats = await stat(sourceDir).catch(() => null)

if (!sourceStats?.isDirectory()) {
  throw new Error(`Build output directory not found: ${sourceDir}`)
}

await rm(targetDir, { recursive: true, force: true })
await mkdir(targetDir, { recursive: true })
await cp(sourceDir, targetDir, { recursive: true })
