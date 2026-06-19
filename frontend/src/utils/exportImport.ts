import type { World } from '../types'

// World JSON export / import for the demo. The exported file is a portable
// snapshot of the canon that can be re-loaded later.

export interface WorldExport {
  format: 'lorebound-world'
  version: 1
  exportedAt: string
  world: World
}

export function exportWorld(world: World): string {
  const payload: WorldExport = {
    format: 'lorebound-world',
    version: 1,
    exportedAt: new Date().toISOString(),
    world
  }
  return JSON.stringify(payload, null, 2)
}

export function downloadWorld(world: World): void {
  const blob = new Blob([exportWorld(world)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safe = world.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  a.download = `lorebound-${safe || 'world'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function parseWorldImport(text: string): World | null {
  try {
    const obj = JSON.parse(text)
    if (obj && obj.format === 'lorebound-world' && obj.world) {
      return obj.world as World
    }
    // Allow a raw world object too.
    if (obj && obj.worldId && Array.isArray(obj.rules)) {
      return obj as World
    }
    return null
  } catch {
    return null
  }
}
