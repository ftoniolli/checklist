import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const skip = new Set(['node_modules', 'dist', 'coverage', '.git'])

async function files(directory) {
  const found = []
  for (const entry of await readdir(directory)) {
    if (skip.has(entry)) continue
    const full = path.join(directory, entry)
    const info = await stat(full)
    if (info.isDirectory()) found.push(...await files(full))
    else found.push(full)
  }
  return found
}

describe('isolamento e segredos', () => {
  it('não versiona chave, token ou senha', async () => {
    const paths = await files(root)
    const offenders = []
    for (const file of paths) {
      if (file.endsWith('.png')) continue
      const text = await readFile(file, 'utf8').catch(() => '')
      if (/BEGIN (OPENSSH|RSA|PRIVATE) KEY/.test(text)) offenders.push(file)
      if (/duckdns\.org\/update/i.test(text)) offenders.push(file)
      if (/token\s*[:=]\s*['"][^'"]+['"]/i.test(text)) offenders.push(file)
    }
    expect(offenders).toEqual([])
  })

  it('não contém script que reinicie o caster ou altere o repositório SERVER', async () => {
    const paths = await files(root)
    const offenders = []
    for (const file of paths) {
      if (file.endsWith('.png') || file.endsWith('.test.js') || file.endsWith('.md')) continue
      const text = await readFile(file, 'utf8').catch(() => '')
      if (/ftoniolli\/SERVER/.test(text) && !file.endsWith('.md')) offenders.push(file)
      if (/docker\s+(restart|compose)|systemctl\s+restart|str2str|rtklib/i.test(text)) offenders.push(path.basename(file))
    }
    expect(offenders).toEqual([])
  })
})
