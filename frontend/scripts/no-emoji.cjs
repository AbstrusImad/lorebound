#!/usr/bin/env node
/*
 * no-emoji.cjs
 * Scans the source tree for emoji characters and the em dash (U+2014).
 * Exits with code 1 if any are found, 0 if the tree is clean.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.wrangler', 'artifacts', '__pycache__', '.pytest_cache'])
const EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.md', '.py', '.cjs'])

const emojiRanges = [
  [0x1f300, 0x1faff],
  [0x1f000, 0x1f2ff],
  [0x2600, 0x27bf],
  [0x2190, 0x21ff],
  [0x2300, 0x23ff],
  [0xfe00, 0xfe0f],
  [0x1f1e6, 0x1f1ff]
]

function isEmoji(cp) {
  return emojiRanges.some(([lo, hi]) => cp >= lo && cp <= hi)
}

let problems = []

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)
  lines.forEach((line, idx) => {
    for (const ch of line) {
      const cp = ch.codePointAt(0)
      if (cp === 0x2014) {
        problems.push(`${file}:${idx + 1} em dash (U+2014)`)
      } else if (isEmoji(cp)) {
        problems.push(`${file}:${idx + 1} emoji U+${cp.toString(16).toUpperCase()}`)
      }
    }
  })
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      walk(path.join(dir, entry.name))
    } else {
      const ext = path.extname(entry.name)
      if (EXT.has(ext)) scanFile(path.join(dir, entry.name))
    }
  }
}

walk(ROOT)

if (problems.length > 0) {
  console.error('no-emoji scan FAILED:')
  problems.forEach((p) => console.error('  ' + p))
  process.exit(1)
} else {
  console.log('no-emoji scan clean: no emoji or em dash found.')
  process.exit(0)
}
