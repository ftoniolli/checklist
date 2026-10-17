const PREFIX = {
  'cat-trator': 'TR',
  'cat-plantadeira': 'PL',
  'cat-pulverizador': 'PU',
  'cat-distribuidor': 'DI',
  'cat-colheitadeira': 'CO',
  'cat-gnss': 'GN',
  'cat-outro': 'EQ'
}

const SITUATIONS = ['em_operacao', 'em_manutencao', 'parada', 'arquivada']

export function validateMachine(input, categories) {
  const name = String(input.name ?? '').trim()
  const categoryId = String(input.categoryId ?? '').trim()
  if (!name) return { ok: false, error: 'Informe o nome da máquina.' }
  const category = categories.find((item) => item.id === categoryId && item.kind === 'maquina')
  if (!category) return { ok: false, error: 'Selecione uma categoria de máquina.' }

  let year = null
  if (input.year !== undefined && input.year !== null && String(input.year).trim() !== '') {
    year = Number(input.year)
    if (!Number.isInteger(year) || year < 1950 || year > 2100) {
      return { ok: false, error: 'Informe um ano de fabricação entre 1950 e 2100.' }
    }
  }

  let hourMeter = null
  if (input.hourMeter !== undefined && input.hourMeter !== null && String(input.hourMeter).trim() !== '') {
    hourMeter = Number(String(input.hourMeter).replace(',', '.'))
    if (!Number.isFinite(hourMeter) || hourMeter < 0) {
      return { ok: false, error: 'Informe um horímetro igual ou maior que zero, ou deixe o campo vazio.' }
    }
  }

  const situation = SITUATIONS.includes(input.situation) ? input.situation : 'em_operacao'
  return {
    ok: true,
    value: {
      name,
      categoryId,
      identifier: String(input.identifier ?? '').trim(),
      manufacturer: String(input.manufacturer ?? '').trim(),
      model: String(input.model ?? '').trim(),
      year,
      serialNumber: String(input.serialNumber ?? '').trim(),
      property: String(input.property ?? '').trim(),
      sector: String(input.sector ?? '').trim(),
      hourMeter,
      responsible: String(input.responsible ?? '').trim(),
      inspectionDate: String(input.inspectionDate ?? '').trim(),
      situation,
      notes: String(input.notes ?? '').trim()
    }
  }
}

export function archiveMachine(machine, now) {
  return {
    ...machine,
    previousSituation: machine.situation === 'arquivada' ? machine.previousSituation : machine.situation,
    situation: 'arquivada',
    archivedAt: now
  }
}

export function restoreMachine(machine, now) {
  const situation = machine.previousSituation && machine.previousSituation !== 'arquivada'
    ? machine.previousSituation
    : 'em_operacao'
  return {
    ...machine,
    situation,
    previousSituation: '',
    archivedAt: null,
    updatedAt: now
  }
}

export function nextIdentifier(category, machines) {
  const prefix = PREFIX[category.id] || prefixFromName(category.name)
  const pattern = new RegExp(`^${prefix}-(\\d+)$`)
  const numbers = machines.map((machine) => {
    const match = pattern.exec(machine.identifier || '')
    return match ? Number(match[1]) : 0
  })
  const next = Math.max(0, ...numbers) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

function prefixFromName(name) {
  const letters = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
  return letters.slice(0, 2) || 'EQ'
}
