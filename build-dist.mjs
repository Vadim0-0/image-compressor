import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const targetDir = resolve('dist')
const sourceCandidates = [
  resolve('.output/public'),
  resolve('.vercel/output/static')
]

let sourceDir = null

for (const candidate of sourceCandidates) {
  const stats = await stat(candidate).catch(() => null)

  if (stats?.isDirectory()) {
    sourceDir = candidate
    break
  }
}

if (!sourceDir) {
  throw new Error(`Build output directory not found. Checked: ${sourceCandidates.join(', ')}`)
}

await rm(targetDir, { recursive: true, force: true })
await mkdir(targetDir, { recursive: true })
await cp(sourceDir, targetDir, { recursive: true })
