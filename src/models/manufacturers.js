const TRACTORS = ['Agrale', 'Case IH', 'John Deere', 'Massey Ferguson', 'New Holland', 'Valtra']
const PLANTERS = ['Baldan', 'Jan', 'John Deere', 'Jumil', 'Kuhn', 'Semeato', 'Stara', 'Tatu Marchesan', 'Vence Tudo']
const SPRAYERS = ['Jacto', 'John Deere', 'Kuhn', 'Stara']
const SPREADERS = ['Jan', 'John Deere', 'Kuhn', 'Piccin', 'Stara']
const HARVESTERS = ['Case IH', 'John Deere', 'Massey Ferguson', 'New Holland', 'Valtra']
const PRECISION = ['Hexagon', 'Jacto', 'John Deere', 'Stara']

const BY_CATEGORY = {
  'cat-trator': TRACTORS,
  'cat-plantadeira': PLANTERS,
  'cat-pulverizador': SPRAYERS,
  'cat-distribuidor': SPREADERS,
  'cat-colheitadeira': HARVESTERS,
  'cat-gnss': PRECISION,
  'cat-monitor': PRECISION,
  'cat-receptor': PRECISION,
  'cat-antena': PRECISION,
  'cat-piloto': PRECISION,
  'cat-controlador': PRECISION,
  'cat-sensor': PRECISION,
  'cat-tablet': PRECISION,
  'cat-terminal': PRECISION,
  'cat-chicote': PRECISION
}

const MACHINES = unique(Object.entries(BY_CATEGORY)
  .filter(([id]) => ['cat-trator', 'cat-plantadeira', 'cat-pulverizador', 'cat-distribuidor', 'cat-colheitadeira', 'cat-gnss'].includes(id))
  .flatMap(([, names]) => names))

const ALL = unique([...MACHINES, ...PRECISION])

export function manufacturersFor(categoryId) {
  if (BY_CATEGORY[categoryId]) return BY_CATEGORY[categoryId]
  if (categoryId === 'cat-outro') return MACHINES
  return ALL
}

export function filterManufacturers(categoryId, query, known = []) {
  const needle = fold(query)
  if (!needle) return []
  return unique([...manufacturersFor(categoryId), ...known])
    .filter((name) => fold(name).includes(needle))
    .sort((left, right) => left.localeCompare(right, 'pt-BR'))
    .slice(0, 8)
}

function unique(names) {
  const seen = new Map()
  for (const name of names) {
    const text = String(name || '').trim()
    const key = fold(text)
    if (!key || seen.has(key)) continue
    seen.set(key, text)
  }
  return [...seen.values()]
}

function fold(value) {
  return String(value || '').trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}
