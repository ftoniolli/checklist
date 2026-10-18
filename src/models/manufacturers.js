const BRANDS = {
  'cat-trator': ['Agrale', 'Case IH', 'Claas', 'CNH', 'Deutz-Fahr', 'Fendt', 'John Deere', 'Kubota', 'Landini', 'LS Tractor', 'Mahindra', 'Massey Ferguson', 'McCormick', 'New Holland', 'Solis', 'Valtra', 'Yanmar'],
  'cat-plantadeira': ['Baldan', 'Case IH', 'Civemasa', 'Fitarelli', 'Great Plains', 'Horsch', 'Ikeda', 'Imasa', 'Jan', 'John Deere', 'Jumil', 'Kinze', 'Kuhn', 'Maschio Gaspardo', 'Monosem', 'Piccin', 'Precision Planting', 'Semeato', 'Stara', 'Tatu Marchesan', 'Väderstad', 'Vence Tudo'],
  'cat-pulverizador': ['Agrifac', 'Amazone', 'Apache', 'Case IH', 'DJI', 'Hardi', 'Horsch', 'Jacto', 'John Deere', 'Kuhn', 'Metalfor', 'Montana', 'New Holland', 'PLA', 'Stara', 'XAG'],
  'cat-distribuidor': ['Amazone', 'Baldan', 'Bogballe', 'Jan', 'Jacto', 'John Deere', 'Kuhn', 'Kverneland', 'Piccin', 'Stara', 'Sulky', 'Tatu Marchesan', 'Vicon'],
  'cat-colheitadeira': ['Case IH', 'Claas', 'Deutz-Fahr', 'Fendt', 'John Deere', 'Massey Ferguson', 'New Holland', 'Valtra', 'Vassalli', 'Yanmar'],
  'cat-gnss': ['Ag Leader', 'Agres', 'Case IH', 'CHCNAV', 'CNH', 'Emlid', 'FieldView', 'FJDynamics', 'Hemisphere', 'Hexagon', 'Jacto', 'John Deere', 'Leica', 'Müller', 'New Holland', 'NovAtel', 'Outback', 'Precision Planting', 'Raven', 'Reichhardt', 'Septentrio', 'Solinftec', 'Stara', 'TeeJet', 'Topcon', 'Trimble'],
  'cat-monitor': ['Ag Leader', 'Agres', 'Auteq', 'Case IH', 'CNH', 'Dickey-john', 'FieldView', 'FJDynamics', 'Hexagon', 'Jacto', 'John Deere', 'Kuhn', 'MC Elettronica', 'Müller', 'New Holland', 'Outback', 'Precision Planting', 'Raven', 'Solinftec', 'Stara', 'TeeJet', 'Topcon', 'Trimble', 'WTK'],
  'cat-receptor': ['Ag Leader', 'CHCNAV', 'CNH', 'Emlid', 'FJDynamics', 'Hemisphere', 'Hexagon', 'John Deere', 'Leica', 'NovAtel', 'Outback', 'Raven', 'Septentrio', 'Topcon', 'Trimble'],
  'cat-antena': ['Ag Leader', 'Hemisphere', 'Hexagon', 'John Deere', 'Leica', 'NovAtel', 'Raven', 'Topcon', 'Trimble'],
  'cat-piloto': ['Ag Leader', 'Agres', 'Case IH', 'CHCNAV', 'CNH', 'FJDynamics', 'Hexagon', 'Jacto', 'John Deere', 'Müller', 'New Holland', 'Outback', 'Raven', 'Reichhardt', 'Stara', 'Topcon', 'Trimble'],
  'cat-controlador': ['Ag Leader', 'Amazone', 'ARAG', 'Auteq', 'CapstanAG', 'Case IH', 'CNH', 'Dickey-john', 'Hardi', 'Hexagon', 'Jacto', 'John Deere', 'MC Elettronica', 'Müller', 'New Holland', 'Precision Planting', 'Raven', 'Stara', 'TeeJet', 'Topcon', 'Trimble', 'WTK'],
  'cat-sensor': ['Ag Leader', 'ARAG', 'Auteq', 'Dickey-john', 'Headsight', 'Hexagon', 'Jacto', 'John Deere', 'MC Elettronica', 'Precision Planting', 'Raven', 'Stara', 'TeeJet', 'Topcon', 'Trimble', 'WTK'],
  'cat-chicote': ['Ag Leader', 'Auteq', 'Case IH', 'CNH', 'Hexagon', 'Jacto', 'John Deere', 'Müller', 'New Holland', 'Precision Planting', 'Raven', 'Stara', 'Topcon', 'Trimble', 'WTK'],
  'cat-tablet': ['Apple', 'Dell', 'FieldView', 'Getac', 'Lenovo', 'LG', 'Multilaser', 'Panasonic', 'Positivo', 'Samsung', 'Solinftec', 'Xiaomi'],
  'cat-terminal': ['Ag Leader', 'Amazone', 'Case IH', 'Claas', 'CNH', 'Fendt', 'FieldView', 'Hexagon', 'Horsch', 'Jacto', 'John Deere', 'Kuhn', 'Kverneland', 'Müller', 'New Holland', 'Raven', 'Reichhardt', 'Stara', 'TeeJet', 'Topcon', 'Trimble']
}

const MODELS = {
  'cat-trator': {
    Agrale: ['4100', '5075', '5105', '575.4'],
    'Case IH': ['Farmall', 'Maxxum', 'Optum', 'Puma', 'Magnum', 'Steiger', 'Quadtrac'],
    Claas: ['Arion', 'Axion', 'Xerion'],
    CNH: ['Farmall', 'Puma', 'Magnum', 'Steiger', 'T6', 'T7', 'T8', 'T9'],
    'Deutz-Fahr': ['Série 5', 'Série 6', 'Série 7', 'Série 8', 'Série 9'],
    Fendt: ['200 Vario', '300 Vario', '700 Vario', '900 Vario', '1000 Vario'],
    'John Deere': ['5000E', '6000J', '6110J', '6125J', '7000J', '7200J', '8R', '9R'],
    Kubota: ['M', 'M7', 'M8'],
    'LS Tractor': ['Plus 80', 'Plus 90', 'U60', 'MT3', 'MT5', 'MT7'],
    'Massey Ferguson': ['4700', '6700', '7700', '8700', '8S'],
    'New Holland': ['TL', 'TT', 'T6', 'T7', 'T8', 'T9'],
    Valtra: ['A', 'AH', 'BH', 'BM', 'T', 'S', 'Q']
  },
  'cat-plantadeira': {
    'Case IH': ['Easy Riser', 'Early Riser'],
    'Great Plains': ['YP'],
    Horsch: ['Maestro'],
    'John Deere': ['1100', '2100', 'DB', 'ExactEmerge', 'MaxEmerge'],
    Jumil: ['JM'],
    Kinze: ['3600'],
    Kuhn: ['Maxima', 'Kosma'],
    Monosem: ['NG Plus'],
    'Precision Planting': ['vSet', 'vDrive', 'DeltaForce', 'SpeedTube', 'SmartFirmer'],
    Semeato: ['SSM'],
    Stara: ['Absoluta', 'Estrela', 'Princesa', 'Ceres'],
    'Tatu Marchesan': ['PST', 'Ultra'],
    Väderstad: ['Tempo'],
    'Vence Tudo': ['Panther']
  },
  'cat-pulverizador': {
    Agrifac: ['Condor'],
    Amazone: ['Pantera'],
    'Case IH': ['Patriot'],
    DJI: ['Agras'],
    Hardi: ['Alpha', 'Saritor'],
    Horsch: ['Leeb'],
    Jacto: ['Uniport 2030', 'Uniport 2530', 'Uniport 3030', 'Uniport 4530', 'Uniport 2000 Plus', 'Condor', 'Advance'],
    'John Deere': ['M4025', 'M4030', 'M4040', '4730'],
    Kuhn: ['Stronger', 'Accura'],
    Montana: ['Parruda', 'Boxer'],
    'New Holland': ['Defensor'],
    Stara: ['Imperador 2000', 'Imperador 3000', 'Imperador 4000'],
    XAG: ['P100']
  },
  'cat-distribuidor': {
    Amazone: ['ZA'],
    Jan: ['Lancer', 'Lancer Maximus'],
    Kuhn: ['Axis', 'Accura'],
    Kverneland: ['Exacta'],
    Piccin: ['Master'],
    Stara: ['Hercules', 'Bruttus', 'Twister']
  },
  'cat-colheitadeira': {
    'Case IH': ['Axial-Flow 150', 'Axial-Flow 250', 'Axial-Flow 7150', 'Axial-Flow 7250', 'Axial-Flow 8250', 'Austoft 8000', 'Austoft 9000'],
    Claas: ['Lexion', 'Trion', 'Tucano'],
    Fendt: ['Ideal'],
    'John Deere': ['S400', 'S500', 'S600', 'S700', 'S7', '1175', '1470', '1550', 'CH570', 'CH670'],
    'Massey Ferguson': ['9690', '9790', '9895'],
    'New Holland': ['TC', 'CX', 'CR', 'CR 7.90', 'CR 8.90'],
    Valtra: ['BC 4500', 'BC 6500', 'BC 7500']
  },
  'cat-monitor': {
    'Ag Leader': ['Integra', 'Versa', 'InCommand 800', 'InCommand 1200'],
    'Case IH': ['AFS Pro 700', 'AFS Pro 1200'],
    CNH: ['AFS Pro 700', 'AFS Pro 1200', 'IntelliView IV', 'IntelliView 12'],
    'Dickey-john': ['IntelliAg'],
    FieldView: ['Drive', 'Cab'],
    Hexagon: ['Ti5', 'Ti7', 'Ti10', 'AgrOn'],
    Jacto: ['Otmis', 'Omni 700'],
    'John Deere': ['CommandCenter', 'GreenStar 3 2630', 'Gen4', 'G5', 'G5 Plus', 'G5 Universal'],
    Müller: ['Track Guide III', 'Touch 800', 'Touch 1200', 'Smart 570'],
    'New Holland': ['IntelliView IV', 'IntelliView 12'],
    Outback: ['S-Lite', 'S3', 'MAX'],
    'Precision Planting': ['20/20', '20/20 Gen3'],
    Raven: ['Envizio Pro', 'Viper 4', 'Viper 4+', 'CR7', 'CR12'],
    Stara: ['Topper 4500', 'Topper 5500'],
    TeeJet: ['Matrix 430', 'Matrix 908', 'Radion 8140'],
    Topcon: ['X25', 'X35', 'XD', 'XD+'],
    Trimble: ['CFX-750', 'FmX', 'TMX-2050', 'GFX-350', 'GFX-750', 'GFX-1060']
  },
  'cat-receptor': {
    'Ag Leader': ['GPS 6000', 'GPS 7500'],
    Emlid: ['Reach RS2', 'Reach RS3', 'Reach RX'],
    FJDynamics: ['AT1', 'AT2'],
    'John Deere': ['StarFire 3000', 'StarFire 6000', 'StarFire 7000', 'StarFire 7500'],
    Leica: ['mojo3D'],
    NovAtel: ['SMART2', 'SMART7'],
    Raven: ['RS1'],
    Topcon: ['AGI-4', 'AGS-2'],
    Trimble: ['AG-372', 'AG-482', 'NAV-500', 'NAV-900']
  },
  'cat-antena': {
    'John Deere': ['StarFire 6000', 'StarFire 7000', 'StarFire 7500'],
    NovAtel: ['VEXXIS'],
    Trimble: ['AG25', 'Zephyr 3']
  },
  'cat-piloto': {
    'Ag Leader': ['SteerCommand', 'SteerCommand Z2'],
    'Case IH': ['AccuGuide'],
    CHCNAV: ['NX510'],
    CNH: ['AccuGuide', 'IntelliSteer', 'AFS AccuGuide'],
    FJDynamics: ['AT1', 'AT2'],
    Hexagon: ['AgrOn'],
    Jacto: ['Otmis'],
    'John Deere': ['AutoTrac', 'AutoTrac Universal'],
    Müller: ['Track Guide III'],
    'New Holland': ['IntelliSteer'],
    Outback: ['eDrive'],
    Raven: ['RS1'],
    Reichhardt: ['PSR'],
    Stara: ['Conecta'],
    Topcon: ['AES-35'],
    Trimble: ['EZ-Steer', 'EZ-Pilot', 'EZ-Pilot Pro', 'Autopilot', 'Autopilot Motor Drive']
  },
  'cat-controlador': {
    'Ag Leader': ['Liquid Product Control'],
    Amazone: ['Amatron 4'],
    ARAG: ['Bravo 180S', 'Bravo 400S', 'IBX100'],
    CapstanAG: ['PinPoint'],
    'Dickey-john': ['IntelliAg'],
    Hardi: ['HC 5500'],
    Hexagon: ['AgrOn'],
    Jacto: ['Otmis'],
    'John Deere': ['Rate Controller 2000', 'GreenStar Rate Controller', 'ExactApply'],
    'Precision Planting': ['20/20', 'vDrive'],
    Raven: ['RCM', 'SC1', 'Sidekick Pro'],
    Stara: ['Topper'],
    TeeJet: ['Radion 8140'],
    Trimble: ['Field-IQ']
  },
  'cat-sensor': {
    'Ag Leader': ['OptRx', 'SureForce'],
    'John Deere': ['ExactApply'],
    'Precision Planting': ['SmartFirmer', 'WaveVision', 'DeltaForce', 'vSet', 'SpeedTube'],
    Topcon: ['CropSpec'],
    Trimble: ['GreenSeeker', 'WeedSeeker 2']
  },
  'cat-tablet': {
    Apple: ['iPad'],
    FieldView: ['Drive', 'Cab'],
    Panasonic: ['Toughbook'],
    Samsung: ['Galaxy Tab']
  },
  'cat-terminal': {
    'Case IH': ['AFS Pro 700', 'AFS Pro 1200'],
    Claas: ['CEBIS', 'CEMOS'],
    CNH: ['AFS Pro 700', 'AFS Pro 1200', 'IntelliView IV', 'IntelliView 12'],
    Fendt: ['Varioterminal'],
    FieldView: ['Drive', 'Cab'],
    'John Deere': ['CommandCenter', 'Gen4', 'G5', 'G5 Universal'],
    Müller: ['Touch 800', 'Touch 1200', 'Smart 570'],
    'New Holland': ['IntelliView IV', 'IntelliView 12'],
    Trimble: ['GFX-350', 'GFX-750', 'GFX-1060', 'TMX-2050']
  }
}

const MACHINE_CATEGORIES = ['cat-trator', 'cat-plantadeira', 'cat-pulverizador', 'cat-distribuidor', 'cat-colheitadeira', 'cat-gnss']
const COMPONENT_CATEGORIES = ['cat-monitor', 'cat-receptor', 'cat-antena', 'cat-piloto', 'cat-controlador', 'cat-sensor', 'cat-chicote', 'cat-tablet', 'cat-terminal']

export function manufacturersFor(categoryId) {
  if (BRANDS[categoryId]) return BRANDS[categoryId]
  if (categoryId === 'cat-outro') return unique(MACHINE_CATEGORIES.flatMap((id) => BRANDS[id]))
  if (categoryId === 'cat-outro-comp') return unique(COMPONENT_CATEGORIES.flatMap((id) => BRANDS[id]))
  return unique(Object.values(BRANDS).flat())
}

export function filterManufacturers(categoryId, query, known = []) {
  return filterNames([...manufacturersFor(categoryId), ...known], query)
}

export function filterModels(categoryId, manufacturer, query, known = []) {
  return filterNames([...modelsFor(categoryId, manufacturer), ...known], query)
}

function modelsFor(categoryId, manufacturer) {
  const table = modelTable(categoryId)
  const brand = matchBrand(Object.keys(table), manufacturer)
  if (brand) return table[brand]
  const needle = fold(manufacturer)
  const brands = needle
    ? Object.keys(table).filter((item) => fold(item).includes(needle))
    : Object.keys(table)
  return brands.flatMap((item) => table[item].map((model) => `${item} ${model}`))
}

function modelTable(categoryId) {
  if (MODELS[categoryId]) return MODELS[categoryId]
  if (categoryId === 'cat-gnss') return mergeModels(['cat-monitor', 'cat-receptor', 'cat-antena', 'cat-piloto'])
  if (categoryId === 'cat-outro') return mergeModels(MACHINE_CATEGORIES)
  if (categoryId === 'cat-outro-comp') return mergeModels(COMPONENT_CATEGORIES)
  return mergeModels(Object.keys(MODELS))
}

function mergeModels(ids) {
  const result = {}
  for (const id of ids) {
    for (const [brand, models] of Object.entries(MODELS[id] || {})) {
      result[brand] = unique([...(result[brand] || []), ...models])
    }
  }
  return result
}

function matchBrand(brands, manufacturer) {
  const needle = fold(manufacturer)
  if (!needle) return ''
  const exact = brands.find((brand) => fold(brand) === needle)
  if (exact) return exact
  const partial = brands.filter((brand) => fold(brand).includes(needle))
  return partial.length === 1 ? partial[0] : ''
}

function filterNames(names, query) {
  const needle = fold(query)
  if (!needle) return []
  return unique(names)
    .filter((name) => fold(name).includes(needle))
    .sort((left, right) => left.localeCompare(right, 'pt-BR'))
    .slice(0, 15)
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
