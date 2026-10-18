import { describe, expect, it } from 'vitest'
import { archiveMachine, nextIdentifier, validateMachine } from '../src/models/machine.js'
import { changeAssociation } from '../src/models/association.js'
import {
  approvalOfMachine,
  inspectionSummary,
  latestInspections,
  listOpenNonconformities,
  normalizeAnswer
} from '../src/models/checklist.js'
import { buildDashboard } from '../src/models/dashboard.js'
import { buildBackup, prepareImport, validateBackup } from '../src/models/backup.js'
import { buildReport } from '../src/models/report.js'
import { validatePhotoLink } from '../src/models/photo.js'
import { mapStorageError } from '../src/models/storageError.js'
import { defaultCategories, defaultTemplates } from '../src/models/seed.js'
import { filterManufacturers, manufacturersFor } from '../src/models/manufacturers.js'
import { validateTemplate } from '../src/models/template.js'

const categories = defaultCategories().filter((category) => category.kind === 'maquina')
const trator = categories.find((category) => category.id === 'cat-trator')
const templates = defaultTemplates()

function inspection(overrides = {}) {
  return {
    id: 'ins-1',
    scope: 'maquina',
    targetId: 'maq-1',
    machineId: 'maq-1',
    templateId: 'tpl-geral',
    status: 'concluida',
    createdAt: '2026-03-01T10:00:00.000Z',
    answers: {},
    ...overrides
  }
}

describe('máquinas', () => {
  it('exige nome e categoria e aceita cadastro sem horímetro ou série', () => {
    expect(validateMachine({ name: ' ', categoryId: '' }, categories).ok).toBe(false)
    const result = validateMachine({ name: 'Trator 01', categoryId: trator.id }, categories)
    expect(result.ok).toBe(true)
    expect(result.value.hourMeter).toBeNull()
    expect(result.value.serialNumber).toBe('')
  })

  it('rejeita categoria inexistente e horímetro negativo', () => {
    expect(validateMachine({ name: 'Trator', categoryId: 'inexistente' }, categories).ok).toBe(false)
    expect(validateMachine({ name: 'Trator', categoryId: trator.id, hourMeter: -1 }, categories).ok).toBe(false)
  })

  it('arquiva sem apagar os dados já registrados', () => {
    const machine = {
      id: 'maq-1',
      name: 'Trator 01',
      serialNumber: 'ABC-9',
      situation: 'em_operacao'
    }
    const archived = archiveMachine(machine, '2026-04-01T12:00:00.000Z')
    expect(archived.situation).toBe('arquivada')
    expect(archived.serialNumber).toBe('ABC-9')
    expect(archived.previousSituation).toBe('em_operacao')
    expect(archived.archivedAt).toBe('2026-04-01T12:00:00.000Z')
  })

  it('gera identificadores independentes por categoria', () => {
    const machines = [{ identifier: 'TR-001' }, { identifier: 'TR-004' }, { identifier: 'PL-001' }]
    expect(nextIdentifier(trator, machines)).toBe('TR-005')
  })
})

describe('associação de plantadeira', () => {
  it('encerra a associação anterior e preserva o histórico', () => {
    const first = changeAssociation([], {
      tractorId: 't1',
      implementId: 'p1',
      now: '2026-01-01T00:00:00.000Z',
      id: 'a1'
    })
    const second = changeAssociation(first.associations, {
      tractorId: 't2',
      implementId: 'p1',
      now: '2026-02-01T00:00:00.000Z',
      id: 'a2'
    })
    const oldLink = second.associations.find((item) => item.id === 'a1')
    const current = second.associations.find((item) => item.id === 'a2')
    expect(second.associations).toHaveLength(2)
    expect(oldLink.endedAt).toBe('2026-02-01T00:00:00.000Z')
    expect(current.endedAt).toBeNull()
    expect(current.tractorId).toBe('t2')
  })

  it('troca o implemento do trator sem reaproveitar o registro antigo', () => {
    const first = changeAssociation([], {
      tractorId: 't1',
      implementId: 'p1',
      now: '2026-01-01T00:00:00.000Z',
      id: 'a1'
    })
    const second = changeAssociation(first.associations, {
      tractorId: 't1',
      implementId: 'p2',
      now: '2026-03-01T00:00:00.000Z',
      id: 'a2'
    })
    expect(second.associations.find((item) => item.implementId === 'p1').endedAt).toBeTruthy()
    expect(second.associations.find((item) => item.endedAt === null).implementId).toBe('p2')
  })
})

describe('checklists', () => {
  const template = templates.find((item) => item.id === 'tpl-geral')

  it('trata item sem resposta como não inspecionado e não como conforme', () => {
    const summary = inspectionSummary(template, inspection())
    expect(summary.uninspected).toBe(summary.total)
    expect(summary.compliant).toBe(0)
    expect(summary.approved).toBe(false)
  })

  it('abre não conformidade somente no estado não conforme e permite encerrar a correção', () => {
    const open = normalizeAnswer({ state: 'nao_conforme', note: 'Cabo rompido' })
    expect(open.correctionStatus).toBe('aberta')
    const answers = { 'sec-instalacao-1': open }
    const summary = inspectionSummary(template, inspection({ answers }))
    expect(summary.openNonconformities).toBe(1)
    const closed = normalizeAnswer({ ...open, correctionStatus: 'concluida' })
    const after = inspectionSummary(template, inspection({
      answers: { 'sec-instalacao-1': closed, 'sec-identificacao-1': { state: 'conforme' } }
    }))
    expect(after.openNonconformities).toBe(0)
  })

  it('não aprova máquina com item não inspecionado ou não conformidade aberta', () => {
    const pending = approvalOfMachine('maq-1', [], [inspection()], templates)
    expect(pending.classification).toBe('Não aprovada')
    expect(pending.approved).toBe(false)

    const answers = Object.fromEntries(template.sections.flatMap((section) => section.items.map((item) => [item.id, { state: 'conforme' }])))
    answers['sec-instalacao-4'] = normalizeAnswer({ state: 'nao_conforme', note: 'Conector oxidado' })
    const rejected = approvalOfMachine('maq-1', [], [inspection({ answers })], templates)
    expect(rejected.classification).toBe('Não aprovada')
    expect(listOpenNonconformities([inspection({ answers })], templates)).toHaveLength(1)
  })

  it('aprova somente a inspeção mais recente de cada modelo quando ela está completa', () => {
    const answers = Object.fromEntries(template.sections.flatMap((section) => section.items.map((item) => [item.id, { state: 'conforme' }])))
    const oldOne = inspection({
      id: 'old',
      createdAt: '2026-01-01T00:00:00.000Z',
      answers: {}
    })
    const recent = inspection({
      id: 'new',
      createdAt: '2026-05-01T00:00:00.000Z',
      answers
    })
    expect(latestInspections([recent, oldOne])).toHaveLength(1)
    const verdict = approvalOfMachine('maq-1', [], [oldOne, recent], templates)
    expect(verdict.classification).toBe('Aprovada')
    expect(verdict.approved).toBe(true)
  })

  it('não inventa resposta de GNSS para item sem evidência', () => {
    const gnss = templates.find((item) => item.id === 'tpl-gnss')
    const summary = inspectionSummary(gnss, inspection({ templateId: 'tpl-gnss' }))
    const satellites = summary.items.find((item) => item.label.startsWith('Quantidade de satélites'))
    expect(satellites.state).toBe('nao_inspecionado')
    expect(satellites.note || '').toBe('')
  })
})

describe('painel', () => {
  it('mostra zero quando ainda não há dados', () => {
    const dashboard = buildDashboard({
      machines: [],
      components: [],
      inspections: [],
      tests: [],
      activities: []
    })
    expect(dashboard).toMatchObject({
      machines: 0,
      components: 0,
      pendingInspections: 0,
      completedInspections: 0,
      openNonconformities: 0,
      operationalTests: 0,
      activities: []
    })
  })

  it('calcula os totais a partir dos registros reais', () => {
    const dashboard = buildDashboard({
      machines: [
        { id: 'm1', situation: 'em_operacao' },
        { id: 'm2', situation: 'arquivada' }
      ],
      components: [{ id: 'c1', archived: false }, { id: 'c2', archived: true }],
      inspections: [
        inspection({ status: 'em_andamento', machineId: 'm1', targetId: 'm1' }),
        inspection({ id: 'done', status: 'concluida', targetId: 'm9', machineId: 'm9' })
      ],
      tests: [
        { result: 'aprovado' },
        { result: 'nao_realizado' }
      ],
      activities: [
        { id: 'a', at: '2026-01-01T00:00:00.000Z', summary: 'Antiga' },
        { id: 'b', at: '2026-06-01T00:00:00.000Z', summary: 'Recente' }
      ]
    })
    expect(dashboard.machines).toBe(1)
    expect(dashboard.components).toBe(1)
    expect(dashboard.completedInspections).toBe(1)
    expect(dashboard.operationalTests).toBe(1)
    expect(dashboard.pendingInspections).toBeGreaterThan(0)
    expect(dashboard.activities[0].summary).toBe('Recente')
  })
})

describe('backup', () => {
  const payload = buildBackup({
    categories,
    machines: [{ id: 'm1', name: 'Trator 01' }],
    components: [],
    associations: [],
    templates,
    inspections: [],
    tests: [],
    photos: [{ id: 'f1', machineId: 'm1', mimeType: 'image/png', dataBase64: 'AQID' }],
    activities: [],
    settings: [{ id: 'principal', propertyName: '' }]
  }, { now: '2026-06-01T00:00:00.000Z' })

  it('recusa arquivo inválido e exige confirmação para substituir', () => {
    expect(() => validateBackup({ format: 'outro' })).toThrow(/backup/i)
    expect(() => prepareImport(payload, { replace: false })).toThrow(/confirma/i)
    const imported = prepareImport(payload, { replace: true })
    expect(imported.machines).toHaveLength(1)
    expect(imported.photos[0].dataBase64).toBe('AQID')
  })

  it('rejeita identificadores duplicados e fotografia sem conteúdo', () => {
    const duplicated = structuredClone(payload)
    duplicated.data.machines.push({ id: 'm1', name: 'Outra' })
    expect(() => validateBackup(duplicated)).toThrow(/duplicad/i)
    const withoutImage = structuredClone(payload)
    withoutImage.data.photos[0].dataBase64 = ''
    expect(() => validateBackup(withoutImage)).toThrow(/fotografia/i)
  })
})

describe('relatório', () => {
  it('não classifica como aprovada uma máquina com pendência de inspeção', () => {
    const report = buildReport({
      propertyName: 'Propriedade informada pelo usuário',
      workTitle: 'Inspeção de validação',
      date: '2026-06-02',
      responsibles: 'Equipe de campo',
      technicalResponsible: 'Responsável técnico',
      conclusion: 'Texto do responsável'
    }, {
      machines: [{ id: 'maq-1', name: 'Trator 01', identifier: 'TR-001', categoryId: 'cat-trator', situation: 'em_operacao' }],
      categories,
      components: [],
      templates,
      inspections: [inspection()],
      tests: [],
      photos: []
    })
    expect(report.machines[0].verdict.classification).toBe('Não aprovada')
    expect(report.machines[0].verdict.approved).toBe(false)
    expect(report.propertyName).toBe('Propriedade informada pelo usuário')
  })
})

describe('fotografias', () => {
  it('não vincula componente de outra máquina', () => {
    const components = [{ id: 'c1', machineId: 'm1' }]
    expect(validatePhotoLink({ machineId: 'm2', componentId: 'c1', components }).ok).toBe(false)
    expect(validatePhotoLink({ machineId: 'm1', componentId: '', components }).ok).toBe(true)
  })
})

describe('modelos configuráveis', () => {
  it('aceita modelo novo sem alterar as categorias internas', () => {
    const result = validateTemplate({
      name: 'Colheitadeira especial',
      scope: 'maquina',
      categoryId: '',
      sections: [{ id: 's1', title: 'Plataforma', items: [{ id: 'i1', label: 'Esteira conferida' }] }]
    })
    expect(result.ok).toBe(true)
  })

  it('inclui os grupos técnicos pedidos para a primeira versão', () => {
    const names = defaultTemplates().map((template) => template.name)
    expect(names).toEqual(expect.arrayContaining([
      'Identificação e instalação',
      'GNSS e posicionamento',
      'Monitor e software',
      'Piloto automático',
      'Plantadeira',
      'Pulverizador autopropelido',
      'Distribuidor de fertilizantes',
      'Componente individual'
    ]))
    const plantadeira = defaultTemplates().find((template) => template.id === 'tpl-plantadeira')
    expect(plantadeira.sections.flatMap((section) => section.items).map((item) => item.label)).toEqual(expect.arrayContaining([
      'Número de linhas',
      'Espaçamento entre linhas',
      'Teste estático registrado',
      'Teste operacional registrado'
    ]))
  })
})

describe('fabricantes', () => {
  it('sugere marcas da categoria conforme o texto e aceita um nome já usado no aparelho', () => {
    expect(filterManufacturers('cat-pulverizador', 'ja')).toEqual(['Jacto'])
    expect(filterManufacturers('cat-plantadeira', 'jan')).toEqual(['Jan'])
    expect(filterManufacturers('cat-trator', 'val')).toEqual(['Valtra'])
    expect(filterManufacturers('cat-trator', 'jacto')).toEqual([])
    expect(filterManufacturers('cat-receptor', 'hexa')).toEqual(['Hexagon'])
    expect(filterManufacturers('cat-pulverizador', 'ima', ['Imasa'])).toEqual(['Imasa'])
    expect(filterManufacturers('cat-trator', '')).toEqual([])
  })

  it('não inclui Kubota nem Deutz', () => {
    const names = [
      ...manufacturersFor('cat-trator'),
      ...manufacturersFor('cat-plantadeira'),
      ...manufacturersFor('cat-pulverizador'),
      ...manufacturersFor('cat-distribuidor'),
      ...manufacturersFor('cat-colheitadeira'),
      ...manufacturersFor('cat-gnss'),
      ...manufacturersFor('cat-outro'),
      ...manufacturersFor('cat-monitor'),
      ...manufacturersFor('')
    ].map((name) => name.toLowerCase())
    expect(names.some((name) => name.includes('kubota') || name.includes('deutz'))).toBe(false)
  })
})

describe('armazenamento', () => {
  it('explica falha de cota sem apagar a mensagem original', () => {
    const error = mapStorageError({ name: 'QuotaExceededError' })
    expect(error.code).toBe('quota')
    expect(error.message).toMatch(/armazenamento/i)
  })
})
