/**
 * One-time script: remove Barry's office background and save as transparent PNG.
 * Run once:  npx tsx --env-file=.env.local scripts/create-barry-transparent.ts
 *
 * Output: public/Barry-AI-transparent.png
 * After running, commit the output file and the compositing pipeline will use it.
 */

import fs from 'fs'
import path from 'path'
import { removeBackground } from '@imgly/background-removal-node'

const INPUT = path.join(process.cwd(), 'public', 'Barry-AI.jpg')
const OUTPUT = path.join(process.cwd(), 'public', 'Barry-AI-transparent.png')

async function main() {
  console.log('[barry-transparent] Loading Barry-AI.jpg...')
  const inputBuffer = fs.readFileSync(INPUT)
  const blob = new Blob([inputBuffer], { type: 'image/jpeg' })

  console.log('[barry-transparent] Removing background (downloads ML model on first run ~50MB)...')
  const resultBlob = await removeBackground(blob, {
    model: 'medium',
    output: { format: 'image/png', quality: 1 },
  })

  const resultBuffer = Buffer.from(await resultBlob.arrayBuffer())
  fs.writeFileSync(OUTPUT, resultBuffer)

  const kb = Math.round(resultBuffer.length / 1024)
  console.log(`[barry-transparent] ✓ Saved to public/Barry-AI-transparent.png (${kb}KB)`)
  console.log('[barry-transparent] Now commit this file and redeploy.')
}

main().catch((err) => {
  console.error('[barry-transparent] Error:', err)
  process.exit(1)
})
