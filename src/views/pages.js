import { area, button, empty, facts, field, h, input, linkButton, optionsOf, select } from './dom.js'
import { buildDashboard } from '../models/dashboard.js'
import { ANSWER_STATES, inspectionSummary } from '../models/checklist.js'
import { buildReport } from '../models/report.js'
import { suggestedTemplateId } from '../models/seed.js'
import {
  CORRECTION_LABEL,
  FUNCTIONAL_LABEL,
  PHYSICAL_LABEL,
  RESULT_LABEL,
  ROLE_LABEL,
  SCOPE_LABEL,
  SEVERITY_LABEL,
  SITUATION_LABEL,
  STATE_LABEL,
  formatDay,
  formatWhen
} from '../models/labels.js'

const NAV = [
  ['painel', 'Painel', '#/painel'],
  ['maquinas', 'Máquinas', '#/maquinas'],
  ['componentes', 'Componentes', '#/componentes'],
  ['checklists', 'Checklists', '#/checklists'],
  ['testes', 'Testes', '#/testes'],
  ['fotos', 'Fotografias', '#/fotos'],
  ['relatorio', 'Relatório', '#/relatorio'],
  ['dados', 'Dados', '#/dados']
]

const ICONS = {
  painel: 'M4 4h7v7H4zM13 4h7v4h-7zM13 12h7v8h-7zM4 15h7v5H4z',
  maquinas: 'M3 16V8h10v8M13 11h4l4 3v2h-8M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  componentes: 'M8 3h8v6H8zM4 12h7v8H4zM13 14h7v6h-7z',
  checklists: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  testes: 'M4 19V5M4 19h16M8 16l3-4 3 2 4-6',
  fotos: 'M4 7h4l2-2h4l2 2h4v11H4zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  relatorio: 'M7 3h7l5 5v13H7zM14 3v5h5M9 13h6M9 17h6',
  dados: 'M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5',
  menu: 'M4 5h16v14H4zM9 5v14'
}

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('class', 'icon')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', ICONS[name] || ICONS.painel)
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', 'currentColor')
  path.setAttribute('stroke-width', '1.75')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  svg.append(path)
  return svg
}

export function appShell(route, extras, content) {
  const collapsed = Boolean(extras.navCollapsed)
  return h('div', { class: collapsed ? 'shell is-collapsed' : 'shell' },
    h('aside', { class: 'nav' },
      h('div', { class: 'brand' }, icon('checklists'), h('span', { class: 'brand-text' }, 'Checklist')),
      ...NAV.map(([name, label, href]) => h('a', {
        href,
        title: label,
        class: route.parts[0] === name ? 'is-active' : '',
        'aria-current': route.parts[0] === name ? 'page' : null
      }, icon(name), h('span', { class: 'nav-label' }, label)))
    ),
    h('div', { class: 'workspace' },
      h('header', { class: 'topbar' },
        h('div', { class: 'topbar-start' },
          h('button', {
            type: 'button',
            class: 'icon-button',
            'data-action': 'toggle-nav',
            'aria-expanded': collapsed ? 'false' : 'true',
            'aria-label': collapsed ? 'Expandir menu' : 'Recolher menu'
          }, icon('menu')),
          h('div', { class: 'identity' }, h('strong', {}, 'Checklist'), h('span', {}, 'ASCAD Agrotecnologia'))
        ),
        extras.offline ? h('span', { class: 'offline' }, 'Sem conexão') : null
      ),
      extras.flash ? h('p', { class: `flash flash-${extras.flash.type}`, role: 'status' }, extras.flash.text) : null,
      h('main', { id: 'conteudo' }, content)
    )
  )
}

export function renderPage(route, snapshot, extras) {
  const [name, second, third] = route.parts
  if (!name || name === 'painel') return dashboardPage(snapshot)
  if (name === 'maquinas' && !second) return machineListPage(snapshot, route.query)
  if (name === 'maquinas' && second === 'nova') return machineFormPage(snapshot, null)
  if (name === 'maquinas' && third === 'editar') return machineFormPage(snapshot, findId(snapshot.machines, second))
  if (name === 'maquinas' && second) return machineDetailPage(snapshot, findId(snapshot.machines, second), extras)
  if (name === 'componentes' && !second) return componentListPage(snapshot)
  if (name === 'componentes' && second === 'novo') return componentFormPage(snapshot, null, route.query.machineId || '')
  if (name === 'componentes' && third === 'editar') return componentFormPage(snapshot, findId(snapshot.components, second))
  if (name === 'componentes') return componentFormPage(snapshot, findId(snapshot.components, second))
  if (name === 'checklists' && !second) return checklistHomePage(snapshot)
  if (name === 'checklists') return checklistPage(snapshot, findId(snapshot.inspections, second))
  if (name === 'testes' && !second) return testListPage(snapshot)
  if (name === 'testes' && second === 'novo') return testFormPage(snapshot, null, route.query)
  if (name === 'testes') return testFormPage(snapshot, findId(snapshot.tests, second))
  if (name === 'fotos' && second) return photoDetailPage(snapshot, findId(snapshot.photos, second), extras)
  if (name === 'fotos') return photoListPage(snapshot, route.query, extras)
  if (name === 'relatorio') return reportPage(snapshot, extras)
  if (name === 'dados' && second === 'categorias') return categoryPage(snapshot)
  if (name === 'dados' && second === 'modelos' && !third) return templateListPage(snapshot)
  if (name === 'dados' && second === 'modelos') return templateFormPage(snapshot, extras.templateDraft)
  if (name === 'dados') return dataPage(snapshot, extras)
  return empty('Página não encontrada.')
}

function dashboardPage(snapshot) {
  const dashboard = buildDashboard(snapshot)
  const cards = [
    ['machines', 'Máquinas cadastradas', dashboard.machines],
    ['components', 'Componentes', dashboard.components],
    ['pending', 'Inspeções pendentes', dashboard.pendingInspections],
    ['completed', 'Inspeções concluídas', dashboard.completedInspections],
    ['nonconformities', 'Não conformidades abertas', dashboard.openNonconformities],
    ['tests', 'Testes operacionais realizados', dashboard.operationalTests]
  ]
  const attention = cards.filter((card) => card[0] === 'pending' || card[0] === 'nonconformities')
  const context = cards.filter((card) => card[0] !== 'pending' && card[0] !== 'nonconformities')
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' },
      h('div', { class: 'titles' },
        h('h1', {}, 'Painel'),
        h('p', { class: 'lede' }, 'Inspeção técnica de máquinas e equipamentos agrícolas.')
      )
    ),
    h('div', { class: 'stats stats-priority' }, attention.map(([key, label, value]) => h('article', {
      class: value > 0 && key === 'nonconformities' ? 'stat is-danger' : 'stat'
    },
      h('span', {}, label),
      h('strong', { 'data-stat': key }, String(value))
    ))),
    h('div', { class: 'quick' },
      linkButton('Nova inspeção', '#/checklists'),
      linkButton('Nova máquina', '#/maquinas/nova', 'button secondary'),
      linkButton('Registrar fotografia', '#/fotos', 'button secondary'),
      linkButton('Gerar relatório', '#/relatorio', 'button ghost')
    ),
    h('div', { class: 'stats' }, context.map(([key, label, value]) => h('article', { class: 'stat' },
      h('span', {}, label),
      h('strong', { 'data-stat': key }, String(value))
    ))),
    h('section', { class: 'card' },
      h('h2', {}, 'Últimas atividades'),
      dashboard.activities.length
        ? h('ul', { class: 'activity' }, dashboard.activities.map((item) => h('li', {}, h('time', {}, formatWhen(item.at)), item.summary)))
        : empty('Nenhuma atividade registrada.')
    )
  )
}

function machineListPage(snapshot, query) {
  const showArchived = query.arquivadas === '1'
  const machines = snapshot.machines.filter((machine) => showArchived || machine.situation !== 'arquivada')
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' },
      h('h1', {}, 'Máquinas'),
      linkButton('Nova máquina', '#/maquinas/nova')
    ),
    h('div', { class: 'toolbar card' },
      field('Buscar', input('busca', '', { placeholder: 'Nome, identificador ou série' })),
      h('a', { class: 'text-link', href: showArchived ? '#/maquinas' : '#/maquinas?arquivadas=1' }, showArchived ? 'Ocultar arquivadas' : 'Mostrar arquivadas')
    ),
    machines.length ? h('div', { class: 'list' }, machines.map((machine) => h('a', {
      class: 'list-card',
      href: `#/maquinas/${machine.id}`,
      'data-search': `${machine.name} ${machine.identifier} ${machine.serialNumber}`.toLowerCase()
    },
      h('strong', {}, machine.name),
      h('span', {}, `${machine.identifier} · ${categoryName(snapshot, machine.categoryId)}`),
      h('em', {}, SITUATION_LABEL[machine.situation] || machine.situation)
    ))) : empty('Nenhuma máquina cadastrada.')
  )
}

function machineFormPage(snapshot, machine) {
  if (machine === undefined) return empty('Máquina não encontrada.')
  const categories = snapshot.categories.filter((category) => category.kind === 'maquina')
  const archived = machine?.situation === 'arquivada'
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' },
      h('h1', {}, machine ? 'Editar máquina' : 'Nova máquina'),
      machine ? linkButton('Voltar', `#/maquinas/${machine.id}`, 'text-link') : linkButton('Voltar', '#/maquinas', 'text-link')
    ),
    h('p', { class: 'hint' }, 'Preencha apenas o que se aplica a esta máquina.'),
    h('form', { class: 'form-stack', 'data-form': 'machine', 'data-id': machine?.id || '' },
      sectionCard('Identificação',
        field('Identificador', input('identifier', machine?.identifier || '', { placeholder: 'Gerado automaticamente se ficar vazio' })),
        field('Nome da máquina', input('name', machine?.name || '', { required: true })),
        field('Categoria', select('categoryId', optionsOf(categories, (item) => item.name), machine?.categoryId || '', { required: true, placeholder: 'Selecione' }))
      ),
      sectionCard('Equipamento',
        field('Fabricante', input('manufacturer', machine?.manufacturer || '')),
        field('Modelo', input('model', machine?.model || '')),
        field('Ano de fabricação', input('year', machine?.year ?? '', { type: 'number', min: '1950', max: '2100' })),
        field('Número de série', input('serialNumber', machine?.serialNumber || '')),
        field('Horímetro', input('hourMeter', machine?.hourMeter ?? '', { inputmode: 'decimal' }), 'Deixe vazio quando a máquina não tiver horímetro.')
      ),
      sectionCard('Local e responsável',
        field('Propriedade', input('property', machine?.property || snapshot.settings.propertyName || '')),
        field('Setor ou talhão', input('sector', machine?.sector || '')),
        field('Responsável', input('responsible', machine?.responsible || '')),
        field('Data da inspeção', input('inspectionDate', machine?.inspectionDate || '', { type: 'date' })),
        archived
          ? h('input', { type: 'hidden', name: 'situation', value: 'arquivada' })
          : field('Situação', select('situation', situationOptions(), machine?.situation || 'em_operacao')),
        field('Observações', area('notes', machine?.notes || ''))
      ),
      h('div', { class: 'form-actions' }, h('button', { type: 'submit', class: 'button' }, 'Salvar máquina'))
    )
  )
}

function machineDetailPage(snapshot, machine, extras) {
  if (!machine) return empty('Máquina não encontrada.')
  const category = snapshot.categories.find((item) => item.id === machine.categoryId)
  const components = snapshot.components.filter((item) => item.machineId === machine.id && !item.archived)
  const related = snapshot.associations.filter((item) => item.tractorId === machine.id || item.implementId === machine.id)
  const current = related.find((item) => item.endedAt == null)
  const inspections = snapshot.inspections.filter((item) => item.targetId === machine.id || item.machineId === machine.id)
  const tests = snapshot.tests.filter((item) => item.machineId === machine.id)
  const photos = snapshot.photos.filter((item) => item.machineId === machine.id)
  const implementOptions = snapshot.machines.filter((item) => item.situation !== 'arquivada' && snapshot.categories.find((categoryItem) => categoryItem.id === item.categoryId)?.role === 'implemento')
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' },
      h('div', {},
        h('h1', {}, machine.name),
        h('p', {}, `${machine.identifier} · ${category?.name || 'Sem categoria'}`)
      ),
      h('div', { class: 'quick' },
        linkButton('Editar', `#/maquinas/${machine.id}/editar`),
        machine.situation === 'arquivada'
          ? button('Restaurar', { 'data-action': 'restore-machine', 'data-id': machine.id })
          : button('Arquivar', { class: 'button danger', 'data-action': 'archive-machine', 'data-id': machine.id })
      )
    ),
    h('article', { class: 'card' }, facts([
      ['Situação', SITUATION_LABEL[machine.situation]],
      ['Fabricante', machine.manufacturer],
      ['Modelo', machine.model],
      ['Ano', machine.year ? String(machine.year) : ''],
      ['Número de série', machine.serialNumber],
      ['Propriedade', machine.property],
      ['Setor ou talhão', machine.sector],
      ['Horímetro', machine.hourMeter == null ? '' : String(machine.hourMeter)],
      ['Responsável', machine.responsible],
      ['Data da inspeção', formatDay(machine.inspectionDate)],
      ['Observações', machine.notes]
    ])),
    h('article', { class: 'card' },
      h('h2', {}, 'Conjunto'),
      current ? h('p', {}, currentText(snapshot, current)) : h('p', {}, 'Nenhuma plantadeira associada no momento.'),
      category?.role === 'trator' ? h('form', { 'data-form': 'association', class: 'inline-form' },
        h('input', { type: 'hidden', name: 'tractorId', value: machine.id }),
        field('Plantadeira', select('implementId', optionsOf(implementOptions, (item) => `${item.identifier} · ${item.name}`), current?.tractorId === machine.id ? current.implementId : '', { placeholder: 'Selecione', required: true })),
        h('button', { type: 'submit', class: 'button' }, current ? 'Alterar associação' : 'Associar plantadeira')
      ) : null,
      related.length ? h('ul', { class: 'activity' }, related
        .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))
        .map((item) => h('li', {}, `${currentText(snapshot, item)} · ${formatDay(item.startedAt)} até ${item.endedAt ? formatDay(item.endedAt) : 'agora'}`))) : null
    ),
    h('article', { class: 'card' },
      h('div', { class: 'screen-head' }, h('h2', {}, 'Componentes'), linkButton('Adicionar componente', `#/componentes/novo?machineId=${machine.id}`)),
      components.length ? h('ul', { class: 'plain' }, components.map((component) => h('li', {}, h('a', { href: `#/componentes/${component.id}/editar` }, `${component.name} · ${categoryName(snapshot, component.categoryId)}`)))) : empty('Nenhum componente neste inventário.')
    ),
    recordLinks('Inspeções', inspections, (item) => `#/checklists/${item.id}`, (item) => `${templateName(snapshot, item.templateId)} · ${item.status === 'concluida' ? 'Concluída' : 'Em andamento'}`),
    recordLinks('Testes', tests, (item) => `#/testes/${item.id}`, (item) => `${item.objective} · ${RESULT_LABEL[item.result]}`),
    h('article', { class: 'card' },
      h('div', { class: 'screen-head' }, h('h2', {}, 'Fotografias'), linkButton('Registrar fotografia', `#/fotos?machineId=${machine.id}`)),
      photoStrip(photos, extras)
    )
  )
}

function componentListPage(snapshot) {
  const components = snapshot.components.filter((item) => !item.archived)
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' }, h('h1', {}, 'Componentes'), linkButton('Novo componente', '#/componentes/novo')),
    components.length ? h('div', { class: 'list' }, components.map((component) => h('a', {
      class: 'list-card',
      href: `#/componentes/${component.id}/editar`
    },
      h('strong', {}, component.name),
      h('span', {}, `${categoryName(snapshot, component.categoryId)} · ${machineName(snapshot, component.machineId)}`),
      h('em', {}, FUNCTIONAL_LABEL[component.functionalState] || '')
    ))) : empty('Nenhum componente cadastrado.')
  )
}

function componentFormPage(snapshot, component, presetMachineId = '') {
  if (component === undefined) return empty('Componente não encontrado.')
  const categories = snapshot.categories.filter((item) => item.kind === 'componente')
  const machines = snapshot.machines.filter((item) => item.situation !== 'arquivada' || item.id === component?.machineId)
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' },
      h('h1', {}, component ? 'Componente' : 'Novo componente'),
      linkButton('Voltar', '#/componentes', 'text-link')
    ),
    h('p', { class: 'hint' }, 'A ficha do componente é independente do checklist geral da máquina.'),
    h('form', { class: 'form-stack', 'data-form': 'component', 'data-id': component?.id || '' },
      sectionCard('Identificação',
        field('Nome', input('name', component?.name || '', { required: true })),
        field('Categoria', select('categoryId', optionsOf(categories, (item) => item.name), component?.categoryId || '', { required: true, placeholder: 'Selecione' })),
        field('Máquina', select('machineId', optionsOf(machines, (item) => `${item.identifier} · ${item.name}`), component?.machineId || presetMachineId, { required: true, placeholder: 'Selecione' }))
      ),
      sectionCard('Equipamento',
        field('Fabricante', input('manufacturer', component?.manufacturer || '')),
        field('Modelo', input('model', component?.model || '')),
        field('Número de série', input('serialNumber', component?.serialNumber || '')),
        field('Versão de software ou firmware', input('firmware', component?.firmware || ''))
      ),
      sectionCard('Condição observada',
        field('Estado físico', select('physicalState', enumOptions(PHYSICAL_LABEL), component?.physicalState || 'nao_verificado')),
        field('Estado de funcionamento', select('functionalState', enumOptions(FUNCTIONAL_LABEL), component?.functionalState || 'nao_verificado')),
        field('Conexões', area('connections', component?.connections || '')),
        field('Data da inspeção', input('inspectionDate', component?.inspectionDate || '', { type: 'date' })),
        field('Observações', area('notes', component?.notes || ''))
      ),
      h('div', { class: 'form-actions' },
        h('button', { type: 'submit', class: 'button' }, 'Salvar componente'),
        component ? button('Arquivar componente', { class: 'button danger', 'data-action': 'archive-component', 'data-id': component.id }) : null,
        component ? linkButton('Checklist do componente', `#/checklists?scope=componente&targetId=${component.id}`, 'button secondary') : null
      )
    )
  )
}

function checklistHomePage(snapshot) {
  const machines = snapshot.machines.filter((item) => item.situation !== 'arquivada')
  const components = snapshot.components.filter((item) => !item.archived)
  const inspections = [...snapshot.inspections].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' }, h('h1', {}, 'Checklists')),
    h('form', { class: 'card form-grid', 'data-form': 'inspection' },
      field('Tipo', select('scope', [{ value: 'maquina', label: 'Máquina' }, { value: 'componente', label: 'Componente' }], 'maquina', { action: 'sync-inspection-form' })),
      h('div', { 'data-panel': 'maquina' }, field('Máquina', select('machineTarget', optionsOf(machines, (item) => `${item.identifier} · ${item.name}`), '', { placeholder: 'Selecione', action: 'sync-inspection-form' }))),
      h('div', { 'data-panel': 'componente', hidden: true }, field('Componente', select('componentTarget', optionsOf(components, (item) => `${item.name} · ${machineName(snapshot, item.machineId)}`), '', { placeholder: 'Selecione', action: 'sync-inspection-form' }))),
      field('Modelo', select('templateId', optionsOf(snapshot.templates.filter((item) => item.scope !== 'componente'), (item) => item.name), 'tpl-geral')),
      field('Responsável', input('responsible', snapshot.settings.technicalResponsible || '')),
      field('Data', input('date', new Date().toISOString().slice(0, 10), { type: 'date' })),
      h('button', { type: 'submit', class: 'button' }, 'Iniciar inspeção')
    ),
    h('section', { class: 'card' },
      h('h2', {}, 'Inspeções'),
      inspections.length ? h('div', { class: 'list' }, inspections.map((inspection) => h('a', { class: 'list-card', href: `#/checklists/${inspection.id}` },
        h('strong', {}, templateName(snapshot, inspection.templateId)),
        h('span', {}, targetLabel(snapshot, inspection)),
        h('em', {}, inspection.status === 'concluida' ? 'Concluída' : 'Em andamento')
      ))) : empty('Nenhuma inspeção registrada.')
    )
  )
}

function checklistPage(snapshot, inspection) {
  if (!inspection) return empty('Inspeção não encontrada.')
  const template = snapshot.templates.find((item) => item.id === inspection.templateId)
  if (!template) return empty('O modelo desta inspeção não está mais disponível.')
  const summary = inspectionSummary(template, inspection)
  const implement = snapshot.machines.find((item) => item.id === inspection.contextImplementId)
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' },
      h('div', {},
        h('h1', {}, template.name),
        h('p', {}, targetLabel(snapshot, inspection))
      ),
      linkButton('Voltar', '#/checklists', 'text-link')
    ),
    template.id === 'tpl-gnss' ? h('p', { class: 'hint' }, 'Registre somente o que foi observado. Sem evidência, mantenha o item como não inspecionado. O aplicativo não consulta o receptor.') : null,
    template.id === 'tpl-piloto' ? h('p', { class: 'hint' }, 'Este registro não envia comandos à máquina e não atualiza firmware.') : null,
    implement ? h('p', { class: 'hint' }, `Plantadeira associada no início desta inspeção: ${implement.name}.`) : null,
    h('div', { class: 'stats compact' },
      stat('Não inspecionados', summary.uninspected),
      stat('Conformes', summary.compliant),
      stat('Não conformes', summary.nonCompliant),
      stat('Não se aplica', summary.notApplicable)
    ),
    ...template.sections.map((section) => h('section', { class: 'card' },
      h('h2', {}, section.title),
      ...section.items.map((item) => answerCard(snapshot, inspection, item))
    )),
    h('div', { class: 'form-actions' },
      inspection.status === 'concluida'
        ? button('Reabrir inspeção', { 'data-action': 'reopen-inspection', 'data-id': inspection.id })
        : button('Concluir inspeção', { 'data-action': 'complete-inspection', 'data-id': inspection.id }),
      summary.uninspected > 0 ? h('p', { class: 'hint' }, 'Itens não inspecionados impedem classificar a máquina como aprovada.') : null
    )
  )
}

function answerCard(snapshot, inspection, item) {
  const stored = inspection.answers?.[item.id]
  const state = stored?.state || 'nao_inspecionado'
  const componentId = inspection.scope === 'componente' ? inspection.targetId : ''
  return h('article', { class: 'item-card', 'data-item-card': item.id },
    h('h3', {}, item.label),
    h('div', { class: 'states', role: 'group', 'aria-label': item.label }, ANSWER_STATES.map((value) => h('button', {
      type: 'button',
      class: `state-button${state === value ? ' is-selected' : ''}`,
      'data-action': 'set-answer',
      'data-inspection': inspection.id,
      'data-item': item.id,
      'data-state': value
    }, STATE_LABEL[value]))),
    h('input', { type: 'hidden', name: 'state', value: state }),
    field('Observação', area('note', stored?.note || '')),
    field('Gravidade', select('severity', [{ value: '', label: 'Não informada' }, ...enumOptions(SEVERITY_LABEL)], stored?.severity || '')),
    field('Ação recomendada', input('recommendedAction', stored?.recommendedAction || '')),
    field('Responsável pela correção', input('correctionOwner', stored?.correctionOwner || '')),
    field('Prazo', input('dueDate', stored?.dueDate || '', { type: 'date' })),
    field('Estado da correção', select('correctionStatus', [{ value: '', label: 'Não informado' }, ...enumOptions(CORRECTION_LABEL)], stored?.correctionStatus || '')),
    h('div', { class: 'form-actions' },
      button('Salvar detalhes', { 'data-action': 'save-answer-details', 'data-inspection': inspection.id, 'data-item': item.id }),
      linkButton('Anexar fotografia', `#/fotos?machineId=${inspection.machineId}&componentId=${componentId}&inspectionId=${inspection.id}&itemId=${item.id}`)
    )
  )
}

function testListPage(snapshot) {
  const tests = [...snapshot.tests].sort((a, b) => String(b.datetime).localeCompare(String(a.datetime)))
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' }, h('h1', {}, 'Testes operacionais'), linkButton('Novo teste', '#/testes/novo')),
    tests.length ? h('div', { class: 'list' }, tests.map((test) => h('a', { class: 'list-card', href: `#/testes/${test.id}` },
      h('strong', {}, test.objective),
      h('span', {}, `${machineName(snapshot, test.machineId)} · ${formatWhen(test.datetime)}`),
      h('em', {}, RESULT_LABEL[test.result])
    ))) : empty('Nenhum teste registrado.')
  )
}

function testFormPage(snapshot, test, query = {}) {
  if (test === undefined) return empty('Teste não encontrado.')
  const machines = snapshot.machines.filter((item) => item.situation !== 'arquivada' || item.id === test?.machineId)
  const components = snapshot.components.filter((item) => !item.archived)
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' }, h('h1', {}, test ? 'Teste operacional' : 'Novo teste'), linkButton('Voltar', '#/testes', 'text-link')),
    h('form', { class: 'form-stack', 'data-form': 'test', 'data-id': test?.id || '' },
      sectionCard('Contexto',
        field('Máquina', select('machineId', optionsOf(machines, (item) => `${item.identifier} · ${item.name}`), test?.machineId || query.machineId || '', { required: true, placeholder: 'Selecione', action: 'filter-components' })),
        field('Componente relacionado', select('componentId', componentOptions(components, test?.machineId || query.machineId || ''), test?.componentId || '', { placeholder: 'Nenhum' })),
        field('Data e hora', input('datetime', test?.datetime || localDateTime(), { type: 'datetime-local', required: true })),
        field('Responsável', input('responsible', test?.responsible || snapshot.settings.technicalResponsible || '', { required: true }))
      ),
      sectionCard('Execução',
        field('Objetivo', input('objective', test?.objective || '', { required: true })),
        field('Procedimento', area('procedure', test?.procedure || '')),
        field('Condições observadas', area('conditions', test?.conditions || '')),
        field('Resultado', select('result', enumOptions(RESULT_LABEL), test?.result || 'nao_realizado', { required: true }))
      ),
      sectionCard('Desfecho',
        field('Falhas', area('failures', test?.failures || '')),
        field('Pendências', area('pending', test?.pending || '')),
        field('Conclusão', area('conclusion', test?.conclusion || ''))
      ),
      h('div', { class: 'form-actions' }, h('button', { type: 'submit', class: 'button' }, 'Salvar teste'))
    )
  )
}

function photoListPage(snapshot, query, extras) {
  const photos = snapshot.photos.filter((photo) => {
    if (query.machineId && photo.machineId !== query.machineId) return false
    if (query.componentId && photo.componentId !== query.componentId) return false
    const day = String(photo.capturedAt || '').slice(0, 10)
    if (query.from && day < query.from) return false
    if (query.to && day > query.to) return false
    return true
  })
  const machines = snapshot.machines
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' }, h('h1', {}, 'Fotografias e anexos')),
    h('form', { class: 'card form-grid', 'data-form': 'photo' },
      field('Máquina', select('machineId', optionsOf(machines, (item) => `${item.identifier} · ${item.name}`), query.machineId || '', { required: true, placeholder: 'Selecione', action: 'filter-components' })),
      field('Componente', select('componentId', componentOptions(snapshot.components, query.machineId || ''), query.componentId || '', { placeholder: 'Nenhum' })),
      field('Descrição', input('description', '')),
      field('Data', input('capturedAt', new Date().toISOString().slice(0, 16), { type: 'datetime-local' })),
      h('input', { type: 'hidden', name: 'inspectionId', value: query.inspectionId || '' }),
      h('input', { type: 'hidden', name: 'itemId', value: query.itemId || '' }),
      h('input', { type: 'hidden', name: 'testId', value: query.testId || '' }),
      field('Câmera do tablet', input('camera', '', { type: 'file', accept: 'image/*', capture: 'environment' })),
      field('Importar imagem', input('file', '', { type: 'file', accept: 'image/*' })),
      h('button', { type: 'submit', class: 'button' }, 'Salvar fotografia')
    ),
    h('form', { class: 'card inline-form', 'data-form': 'photo-filter' },
      field('Filtrar por máquina', select('machineId', optionsOf(machines, (item) => item.name), query.machineId || '', { placeholder: 'Todas' })),
      field('Componente', select('componentId', componentOptions(snapshot.components, query.machineId || ''), query.componentId || '', { placeholder: 'Todos' })),
      field('De', input('from', query.from || '', { type: 'date' })),
      field('Até', input('to', query.to || '', { type: 'date' })),
      h('button', { type: 'submit', class: 'button secondary' }, 'Filtrar')
    ),
    photos.length ? h('div', { class: 'gallery' }, photos.map((photo) => h('a', { href: `#/fotos/${photo.id}`, class: 'photo-card' },
      h('img', { src: extras.photoUrl(photo.id), alt: photo.description || 'Fotografia da inspeção' }),
      h('span', {}, `${machineName(snapshot, photo.machineId)} · ${formatDay(photo.capturedAt)}`)
    ))) : empty('Nenhuma fotografia encontrada.')
  )
}

function photoDetailPage(snapshot, photo, extras) {
  if (!photo) return empty('Fotografia não encontrada.')
  const machine = snapshot.machines.find((item) => item.id === photo.machineId)
  const components = snapshot.components.filter((item) => item.machineId === photo.machineId && !item.archived)
  const inspection = snapshot.inspections.find((item) => item.id === photo.inspectionId)
  const template = snapshot.templates.find((item) => item.id === inspection?.templateId)
  const checklistItem = template?.sections.flatMap((section) => section.items).find((item) => item.id === photo.itemId)
  const test = snapshot.tests.find((item) => item.id === photo.testId)
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' }, h('h1', {}, 'Fotografia'), linkButton('Voltar', '#/fotos', 'text-link')),
    h('figure', { class: 'card viewer' },
      h('img', { src: extras.photoUrl(photo.id), alt: photo.description || 'Fotografia ampliada' }),
      h('figcaption', {}, photo.description || 'Sem descrição')
    ),
    h('article', { class: 'card' }, facts([
      ['Máquina', machine?.name || ''],
      ['Identificador', machine?.identifier || ''],
      ['Data', formatWhen(photo.capturedAt)],
      ['Descrição', photo.description],
      ['Checklist', checklistItem ? `${template.name}: ${checklistItem.label}` : ''],
      ['Teste', test?.objective || '']
    ])),
    h('article', { class: 'card' },
      h('h2', {}, 'Componentes da máquina'),
      components.length ? h('ul', { class: 'plain' }, components.map((component) => h('li', {
        class: component.id === photo.componentId ? 'is-highlight' : ''
      }, component.id === photo.componentId ? `${component.name} · associado a esta fotografia` : component.name))) : empty('A máquina não tem componentes cadastrados.'),
      photo.componentId ? null : h('p', { class: 'hint' }, 'Nenhum componente foi associado a esta fotografia.')
    ),
    button('Excluir fotografia', { class: 'button danger', 'data-action': 'delete-photo', 'data-id': photo.id })
  )
}

function reportPage(snapshot, extras) {
  const header = extras.reportHeader || defaultReportHeader(snapshot)
  const report = prepareReport(snapshot, header)
  const machines = snapshot.machines.filter((item) => header.includeArchived || item.situation !== 'arquivada' || item.id === header.machineId)
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head no-print' }, h('h1', {}, 'Relatório técnico')),
    h('form', { class: 'form-stack no-print', 'data-form': 'report' },
      sectionCard('Identificação',
        field('Propriedade', input('propertyName', header.propertyName || '')),
        field('Identificação do trabalho', input('workTitle', header.workTitle || '')),
        field('Data da inspeção', input('date', header.date || '', { type: 'date' })),
        field('Responsáveis', input('responsibles', header.responsibles || '')),
        field('Responsável técnico', input('technicalResponsible', header.technicalResponsible || ''))
      ),
      sectionCard('Filtro',
        field('Máquina', select('machineId', optionsOf(machines, (item) => `${item.identifier} · ${item.name}`), header.machineId || '', { placeholder: 'Todas' })),
        field('Categoria', select('categoryId', optionsOf(snapshot.categories.filter((item) => item.kind === 'maquina'), (item) => item.name), header.categoryId || '', { placeholder: 'Todas' })),
        field('Período inicial', input('from', header.from || '', { type: 'date' })),
        field('Período final', input('to', header.to || '', { type: 'date' })),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'includeArchived', checked: header.includeArchived }), 'Incluir máquinas arquivadas')
      ),
      sectionCard('Conclusão',
        field('Conclusão', area('conclusion', header.conclusion || ''))
      ),
      h('div', { class: 'form-actions' },
        h('button', { type: 'submit', class: 'button', 'data-submit': 'pdf' }, 'Exportar PDF'),
        h('button', { type: 'submit', class: 'button secondary', 'data-submit': 'preview' }, 'Atualizar prévia'),
        h('button', { type: 'submit', class: 'button ghost', 'data-submit': 'print' }, 'Imprimir')
      )
    ),
    reportDocument(report, extras)
  )
}

function dataPage(snapshot, extras) {
  const counts = pendingSummary(extras.pendingImport)
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' }, h('h1', {}, 'Dados e backup')),
    h('article', { class: 'card warning-card' },
      h('h2', {}, 'Os dados ficam neste dispositivo'),
      h('p', {}, 'Inspeções, fotografias e relatórios não são enviados a um servidor. Limpar o navegador pode apagar o trabalho. Faça um backup periódico e guarde o arquivo fora do tablet.'),
      extras.storage ? h('p', {}, `Uso estimado: ${formatBytes(extras.storage.usage)} de ${formatBytes(extras.storage.quota)}.`) : null,
      extras.installAvailable ? button('Instalar aplicativo', { 'data-action': 'install-app' }) : h('p', {}, 'No Chrome do tablet, use o menu do navegador e escolha Instalar aplicativo.')
    ),
    h('form', { class: 'card form-grid', 'data-form': 'settings' },
      field('Organização', input('organizationName', snapshot.settings.organizationName || '')),
      field('Propriedade padrão', input('propertyName', snapshot.settings.propertyName || ''), 'Usada apenas para preencher novos cadastros e relatórios.'),
      field('Responsável técnico padrão', input('technicalResponsible', snapshot.settings.technicalResponsible || '')),
      h('button', { type: 'submit', class: 'button' }, 'Salvar preferências')
    ),
    h('article', { class: 'card' },
      h('h2', {}, 'Backup completo'),
      h('p', {}, 'O arquivo inclui cadastros, checklists, testes e fotografias.'),
      button('Exportar backup', { 'data-action': 'export-backup' }),
      field('Importar backup', h('input', { type: 'file', accept: 'application/json', 'data-action': 'read-backup' }))
    ),
    extras.pendingImport ? h('article', { class: 'card warning-card' },
      h('h2', {}, 'Confirmar restauração'),
      h('p', {}, 'A restauração substitui os dados deste dispositivo. Essa ação não é automática.'),
      h('ul', {}, Object.entries(counts).map(([label, value]) => h('li', {}, `${label}: ${value}`))),
      button('Substituir dados deste dispositivo', { class: 'button danger', 'data-action': 'confirm-import' }),
      button('Cancelar', { class: 'button secondary', 'data-action': 'cancel-import' })
    ) : null,
    h('div', { class: 'quick' },
      linkButton('Categorias', '#/dados/categorias', 'button secondary'),
      linkButton('Modelos de checklist', '#/dados/modelos', 'button secondary')
    )
  )
}

function categoryPage(snapshot) {
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' }, h('h1', {}, 'Categorias'), linkButton('Voltar', '#/dados', 'text-link')),
    h('form', { class: 'card form-grid', 'data-form': 'category' },
      field('Nome', input('name', '', { required: true })),
      field('Tipo', select('kind', [{ value: 'maquina', label: 'Máquina' }, { value: 'componente', label: 'Componente' }], 'maquina')),
      field('Associação', select('role', enumOptions(ROLE_LABEL), ''), 'Use Trator ou Implemento apenas quando a categoria participar de um conjunto.'),
      h('button', { type: 'submit', class: 'button' }, 'Adicionar categoria')
    ),
    h('div', { class: 'list' }, snapshot.categories.map((category) => h('article', { class: 'list-card' },
      h('strong', {}, category.name),
      h('span', {}, `${category.kind === 'maquina' ? 'Máquina' : 'Componente'} · ${ROLE_LABEL[category.role] || 'Sem associação'}`),
      category.builtin ? h('em', {}, 'Inicial') : h('em', {}, 'Personalizada')
    )))
  )
}

function templateListPage(snapshot) {
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' }, h('h1', {}, 'Modelos de checklist'), linkButton('Novo modelo', '#/dados/modelos/novo')),
    h('div', { class: 'list' }, snapshot.templates.map((template) => h('a', { class: 'list-card', href: `#/dados/modelos/${template.id}` },
      h('strong', {}, template.name),
      h('span', {}, SCOPE_LABEL[template.scope] || template.scope),
      h('em', {}, `${template.sections.reduce((sum, section) => sum + section.items.length, 0)} itens`)
    )))
  )
}

function templateFormPage(snapshot, draft) {
  if (!draft) return empty('Modelo não encontrado.')
  const categories = snapshot.categories
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' }, h('h1', {}, draft.id ? 'Editar modelo' : 'Novo modelo'), linkButton('Voltar', '#/dados/modelos', 'text-link')),
    h('form', { class: 'card', 'data-form': 'template', 'data-id': draft.id || '' },
      field('Nome', input('name', draft.name || '')),
      field('Aplicação', select('scope', enumOptions(SCOPE_LABEL), draft.scope || 'maquina')),
      field('Categoria sugerida', select('categoryId', optionsOf(categories, (item) => item.name), draft.categoryId || '', { placeholder: 'Qualquer' })),
      ...draft.sections.map((section) => h('fieldset', { 'data-section-id': section.id, class: 'template-section' },
        h('legend', {}, 'Seção'),
        field('Título', input('sectionTitle', section.title || '')),
        ...section.items.map((item) => h('div', { class: 'template-item', 'data-item-id': item.id },
          field('Item', input('itemLabel', item.label || '')),
          button('Remover item', { class: 'button secondary', 'data-action': 'remove-template-item', 'data-section': section.id, 'data-item': item.id })
        )),
        button('Adicionar item', { 'data-action': 'add-template-item', 'data-section': section.id })
      )),
      h('div', { class: 'form-actions' },
        button('Adicionar seção', { class: 'button secondary', 'data-action': 'add-template-section' }),
        h('button', { type: 'submit', class: 'button' }, 'Salvar modelo')
      )
    )
  )
}

function reportDocument(report, extras) {
  return h('article', { class: 'print-sheet card' },
    h('p', { class: 'eyebrow' }, report.organizationName),
    h('h1', {}, 'Relatório técnico'),
    facts([
      ['Propriedade', report.propertyName],
      ['Trabalho', report.workTitle],
      ['Data da inspeção', formatDay(report.date)],
      ['Responsáveis', report.responsibles],
      ['Responsável técnico', report.technicalResponsible]
    ]),
    ...report.machines.flatMap((machine) => [
      h('h2', {}, `${machine.identifier || ''} ${machine.name}`.trim()),
      h('p', { class: `verdict ${machine.verdict.approved ? 'is-ok' : 'is-bad'}` }, machine.verdict.classification),
      machine.verdict.reasons.length ? h('ul', {}, machine.verdict.reasons.map((reason) => h('li', {}, reason))) : null,
      facts([
        ['Categoria', machine.categoryName],
        ['Fabricante', machine.manufacturer],
        ['Modelo', machine.model],
        ['Número de série', machine.serialNumber],
        ['Setor ou talhão', machine.sector],
        ['Horímetro', machine.hourMeter == null ? '' : String(machine.hourMeter)]
      ]),
      h('h3', {}, 'Componentes'),
      simpleTable(['Componente', 'Categoria', 'Série'], machine.components.map((component) => [component.name, component.categoryName, component.serialNumber])),
      h('h3', {}, 'Checklists'),
      ...machine.inspections.map((inspection) => h('section', {},
        h('h4', {}, `${inspection.templateName} · ${inspection.status === 'concluida' ? 'Concluída' : 'Em andamento'}`),
        simpleTable(['Item', 'Estado', 'Observação'], (inspection.summary?.items || []).map((item) => [item.label, STATE_LABEL[item.state], item.note || '']))
      )),
      h('h3', {}, 'Testes'),
      simpleTable(['Data', 'Objetivo', 'Resultado'], machine.tests.map((test) => [formatWhen(test.datetime), test.objective, RESULT_LABEL[test.result]])),
      h('h3', {}, 'Não conformidades'),
      simpleTable(['Item', 'Ação'], machine.openNonconformities.map((item) => [item.label, item.recommendedAction || item.note || ''])),
      h('h3', {}, 'Fotografias'),
      ...machine.photos.map((photo) => h('figure', { class: 'report-photo' },
        photo.blob ? h('img', { src: extras.photoUrl(photo.id), alt: photo.description || 'Fotografia do relatório' }) : h('p', {}, 'Imagem indisponível'),
        h('figcaption', {}, `${photo.description || 'Sem descrição'} · ${photo.componentName || 'Sem componente associado'} · ${formatWhen(photo.capturedAt)}`)
      ))
    ]),
    h('h2', {}, 'Conclusão'),
    h('p', {}, report.conclusion || 'Sem conclusão registrada.'),
    h('p', { class: 'signature' }, report.technicalResponsible || 'Responsável técnico')
  )
}

export function prepareReport(snapshot, header) {
  const includeArchived = Boolean(header.includeArchived)
  const machines = snapshot.machines.filter((machine) => includeArchived || machine.situation !== 'arquivada')
  const components = snapshot.components.filter((component) => !component.archived).map((component) => ({
    ...component,
    categoryName: categoryName(snapshot, component.categoryId)
  }))
  const photos = snapshot.photos.map((photo) => ({
    ...photo,
    componentName: snapshot.components.find((component) => component.id === photo.componentId)?.name || ''
  }))
  return buildReport({
    ...header,
    organizationName: snapshot.settings.organizationName
  }, {
    ...snapshot,
    machines,
    components,
    photos
  })
}

export function defaultReportHeader(snapshot) {
  return {
    propertyName: snapshot.settings.propertyName || '',
    workTitle: '',
    date: new Date().toISOString().slice(0, 10),
    responsibles: '',
    technicalResponsible: snapshot.settings.technicalResponsible || '',
    conclusion: '',
    machineId: '',
    categoryId: '',
    from: '',
    to: '',
    includeArchived: false
  }
}

export function readTemplateDraft(form) {
  return {
    id: form.dataset.id || undefined,
    name: form.querySelector('[name="name"]').value,
    scope: form.querySelector('[name="scope"]').value,
    categoryId: form.querySelector('[name="categoryId"]').value,
    sections: [...form.querySelectorAll('[data-section-id]')].map((section) => ({
      id: section.dataset.sectionId,
      title: section.querySelector('[name="sectionTitle"]').value,
      items: [...section.querySelectorAll('[data-item-id]')].map((item) => ({
        id: item.dataset.itemId,
        label: item.querySelector('[name="itemLabel"]').value
      }))
    }))
  }
}

function sectionCard(title, ...nodes) {
  return h('section', { class: 'card form-grid' }, h('h2', {}, title), ...nodes)
}

function simpleTable(headers, rows) {
  return h('table', {},
    h('thead', {}, h('tr', {}, headers.map((header) => h('th', {}, header)))),
    h('tbody', {}, (rows.length ? rows : [['Nenhum registro.', ...headers.slice(1).map(() => '')]]).map((row) => h('tr', {}, row.map((cell) => h('td', {}, cell || '—')))))
  )
}

function stat(label, value) {
  return h('article', { class: 'stat' }, h('span', {}, label), h('strong', {}, String(value)))
}

function recordLinks(title, records, href, label) {
  return h('article', { class: 'card' },
    h('h2', {}, title),
    records.length ? h('ul', { class: 'plain' }, records.map((record) => h('li', {}, h('a', { href: href(record) }, label(record))))) : empty('Nenhum registro.')
  )
}

function photoStrip(photos, extras) {
  if (!photos.length) return empty('Nenhuma fotografia.')
  return h('div', { class: 'gallery' }, photos.map((photo) => h('a', { href: `#/fotos/${photo.id}` }, h('img', { src: extras.photoUrl(photo.id), alt: photo.description || 'Fotografia' }))))
}

function situationOptions() {
  return ['em_operacao', 'em_manutencao', 'parada'].map((value) => ({ value, label: SITUATION_LABEL[value] }))
}

function enumOptions(labels) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}

function componentOptions(components, machineId) {
  return optionsOf(components.filter((component) => !machineId || component.machineId === machineId), (component) => component.name)
}

function categoryName(snapshot, id) {
  return snapshot.categories.find((category) => category.id === id)?.name || ''
}

function machineName(snapshot, id) {
  return snapshot.machines.find((machine) => machine.id === id)?.name || 'Máquina não encontrada'
}

function templateName(snapshot, id) {
  return snapshot.templates.find((template) => template.id === id)?.name || 'Checklist'
}

function targetLabel(snapshot, inspection) {
  if (inspection.scope === 'componente') {
    const component = snapshot.components.find((item) => item.id === inspection.targetId)
    return component ? `${component.name} · ${machineName(snapshot, component.machineId)}` : 'Componente'
  }
  const machine = snapshot.machines.find((item) => item.id === inspection.targetId)
  return machine ? `${machine.identifier} · ${machine.name}` : 'Máquina'
}

function currentText(snapshot, association) {
  const tractor = snapshot.machines.find((item) => item.id === association.tractorId)
  const implement = snapshot.machines.find((item) => item.id === association.implementId)
  return `${tractor?.name || 'Trator'} com ${implement?.name || 'plantadeira'}`
}

function findId(records, id) {
  return records.find((record) => record.id === id)
}

function localDateTime() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function formatBytes(value) {
  if (!Number.isFinite(value)) return 'indisponível'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function pendingSummary(payload) {
  if (!payload?.data) return {}
  return {
    Máquinas: payload.data.machines.length,
    Componentes: payload.data.components.length,
    Inspeções: payload.data.inspections.length,
    Testes: payload.data.tests.length,
    Fotografias: payload.data.photos.length
  }
}

export function syncInspectionForm(form, snapshot) {
  const scope = form.querySelector('[name="scope"]').value
  form.querySelector('[data-panel="maquina"]').hidden = scope !== 'maquina'
  form.querySelector('[data-panel="componente"]').hidden = scope !== 'componente'
  const targetId = scope === 'componente'
    ? form.querySelector('[name="componentTarget"]').value
    : form.querySelector('[name="machineTarget"]').value
  const target = scope === 'componente'
    ? snapshot.components.find((item) => item.id === targetId)
    : snapshot.machines.find((item) => item.id === targetId)
  const templates = snapshot.templates.filter((template) => template.scope === scope || template.scope === 'ambos')
  const selectNode = form.querySelector('[name="templateId"]')
  const current = selectNode.value
  selectNode.replaceChildren(...templates.map((template) => h('option', { value: template.id }, template.name)))
  const suggested = target ? suggestedTemplateId(target, scope) : templates[0]?.id
  const next = templates.some((template) => template.id === current) ? current : suggested
  if (next) selectNode.value = next
}

export { suggestedTemplateId }
