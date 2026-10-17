export const BACKUP_STORES = [
  'categories',
  'machines',
  'components',
  'associations',
  'templates',
  'inspections',
  'tests',
  'photos',
  'activities',
  'settings'
]

export function buildBackup(data, { now }) {
  return {
    format: 'checklist-backup',
    version: 1,
    exportedAt: now,
    data: Object.fromEntries(BACKUP_STORES.map((key) => [key, data[key] || []]))
  }
}

export function validateBackup(payload) {
  if (!payload || payload.format !== 'checklist-backup') {
    throw new Error('Arquivo não é um backup do Checklist.')
  }
  if (payload.version !== 1) throw new Error('Versão de backup não suportada.')
  if (!payload.data || typeof payload.data !== 'object') throw new Error('Backup sem dados.')

  for (const key of BACKUP_STORES) {
    if (!Array.isArray(payload.data[key])) throw new Error(`Backup inválido: lista ausente (${key}).`)
    const ids = new Set()
    for (const record of payload.data[key]) {
      if (!record || typeof record.id !== 'string' || !record.id) {
        throw new Error(`Registro sem identificador em ${key}.`)
      }
      if (ids.has(record.id)) throw new Error(`Identificador duplicado em ${key}.`)
      ids.add(record.id)
    }
  }

  for (const photo of payload.data.photos) {
    if (!photo.dataBase64) throw new Error('Fotografia sem conteúdo no backup.')
    if (!photo.machineId) throw new Error('Fotografia sem máquina no backup.')
  }
  return payload
}

export function prepareImport(payload, { replace } = {}) {
  const valid = validateBackup(payload)
  if (replace !== true) {
    throw new Error('É preciso confirmar a substituição dos dados deste dispositivo antes de restaurar o backup.')
  }
  return valid.data
}
