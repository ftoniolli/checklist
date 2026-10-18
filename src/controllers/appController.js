import { createRepository, openDatabase } from '../services/database.js'
import { validateBackup } from '../models/backup.js'
import { validatePhotoLink } from '../models/photo.js'
import { inspectionSummary } from '../models/checklist.js'
import {
  appShell,
  defaultReportHeader,
  prepareReport,
  readTemplateDraft,
  renderPage,
  syncInspectionForm,
  syncReveals
} from '../views/pages.js'

let repository
let root
let flash = null
let flashFresh = false
let offline = false
let windowBound = false
let installEvent = null
let storageEstimate = null
let pendingImport = null
let templateDraft = null
let templateDraftHash = ''
let reportHeader = null
let reportSubmit = 'preview'
let navCollapsed = true
let queue = Promise.resolve()
let objectUrls = []
let snapshot = null

export function settled() {
  return queue
}

export function openRoute(hash) {
  if (location.hash !== hash) location.hash = hash
  return schedule()
}

export async function stopApp() {
  repository?.database?.close()
  repository = null
  revokeUrls()
}

export async function startApp(target = document.querySelector('#app')) {
  root = target
  repository = createRepository(await openDatabase())
  await repository.ensureSeed()
  root.addEventListener('click', (event) => {
    const target = event.target.closest?.('[data-action]')
    if (!target || !root.contains(target)) return
    const action = {
      name: target.dataset.action,
      id: target.dataset.id || '',
      inspection: target.dataset.inspection || '',
      item: target.dataset.item || '',
      state: target.dataset.state || '',
      section: target.dataset.section || '',
      card: target.closest('[data-item-card]')
    }
    queue = queue.then(() => onClick(action)).catch(showError)
  })
  root.addEventListener('submit', (event) => {
    const form = event.target
    if (!(form instanceof HTMLFormElement) || !root.contains(form)) return
    event.preventDefault()
    const submitter = event.submitter?.dataset?.submit || reportSubmit
    queue = queue.then(() => onSubmit(form, submitter)).catch(showError)
  })
  root.addEventListener('change', (event) => {
    const input = event.target
    queue = queue.then(() => onChange(input)).catch(showError)
  })
  root.addEventListener('input', onInput)
  if (!windowBound) {
    windowBound = true
    window.addEventListener('hashchange', () => {
      queue = queue.then(() => render()).catch(showError)
    })
    window.addEventListener('online', () => { offline = false; schedule() })
    window.addEventListener('offline', () => { offline = true; schedule() })
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      installEvent = event
      schedule()
    })
  }
  offline = typeof navigator !== 'undefined' && navigator.onLine === false
  if (!location.hash) location.hash = '#/painel'
  await refreshStorage()
  schedule()
  return settled()
}

function schedule() {
  queue = queue.then(() => render()).catch(showError)
  return queue
}

async function render() {
  const visibleFlash = flashFresh ? flash : null
  flashFresh = false
  revokeUrls()
  snapshot = await repository.snapshot()
  const route = parseHash()
  if (route.parts[0] === 'dados' && route.parts[1] === 'modelos' && route.parts[2]) {
    if (templateDraftHash !== location.hash) {
      const id = route.parts[2] === 'novo' ? '' : route.parts[2]
      const source = snapshot.templates.find((template) => template.id === id)
      templateDraft = source ? structuredClone(source) : blankTemplate()
      templateDraftHash = location.hash
    }
  }
  const page = renderPage(route, snapshot, {
    flash: visibleFlash,
    offline,
    photoUrl,
    storage: storageEstimate,
    installAvailable: Boolean(installEvent),
    pendingImport,
    templateDraft,
    reportHeader
  })
  root.replaceChildren(appShell(route, { flash: visibleFlash, offline, navCollapsed }, page))
  const inspectionForm = root.querySelector('[data-form="inspection"]')
  if (inspectionForm) syncInspectionForm(inspectionForm, snapshot)
  syncReveals(root)
  document.title = 'Checklist'
}

function parseHash(hash = location.hash) {
  const raw = (hash || '#/painel').replace(/^#/, '') || '/painel'
  const [path, queryString = ''] = raw.split('?')
  const parts = path.split('/').filter(Boolean)
  return { parts, query: Object.fromEntries(new URLSearchParams(queryString)) }
}

async function onClick(action) {
  if (action.name === 'toggle-nav') {
    navCollapsed = !navCollapsed
    await render()
  } else if (action.name === 'reset-data') {
    if (!window.confirm('Apagar todos os cadastros, inspeções, fotos e preferências deste dispositivo?')) return
    await repository.resetDevice()
    pendingImport = null
    templateDraft = null
    reportHeader = null
    notify('Os dados deste dispositivo foram apagados.')
    await go('#/painel')
  } else if (action.name === 'archive-machine') {
    if (!window.confirm('Arquivar esta máquina? O histórico de inspeções será mantido.')) return
    await repository.archiveMachine(action.id)
    notify('Máquina arquivada.')
    await go('#/maquinas')
  } else if (action.name === 'restore-machine') {
    await repository.restoreMachine(action.id)
    notify('Máquina restaurada.')
    await render()
  } else if (action.name === 'archive-component') {
    if (!window.confirm('Arquivar este componente? O histórico será mantido.')) return
    await repository.archiveComponent(action.id)
    notify('Componente arquivado.')
    await go('#/componentes')
  } else if (action.name === 'set-answer') {
    await repository.updateAnswer(action.inspection, action.item, { state: action.state })
    await render()
  } else if (action.name === 'save-answer-details') {
    await repository.updateAnswer(action.inspection, action.item, readCard(action.card))
    notify('Detalhes do item salvos.')
    await render()
  } else if (action.name === 'complete-inspection') {
    const inspection = await repository.getInspection(action.id)
    const template = snapshot.templates.find((item) => item.id === inspection.templateId)
    const summary = inspectionSummary(template, inspection)
    const warning = summary.uninspected > 0
      ? 'Ainda há itens não inspecionados. A inspeção será concluída, mas a máquina não será classificada como aprovada. Deseja concluir?'
      : 'Concluir esta inspeção?'
    if (!window.confirm(warning)) return
    await repository.setInspectionStatus(action.id, 'concluida')
    notify('Inspeção concluída.')
    await render()
  } else if (action.name === 'reopen-inspection') {
    await repository.setInspectionStatus(action.id, 'em_andamento')
    notify('Inspeção reaberta.')
    await render()
  } else if (action.name === 'delete-photo') {
    if (!window.confirm('Excluir esta fotografia? A exclusão vale para este dispositivo.')) return
    await repository.deletePhoto(action.id)
    notify('Fotografia excluída.')
    await go('#/fotos')
  } else if (action.name === 'export-backup') {
    await downloadBackup()
  } else if (action.name === 'confirm-import') {
    if (!pendingImport) return
    if (!window.confirm('Substituir todos os dados deste dispositivo pelo backup selecionado?')) return
    await repository.importBackup(pendingImport, { replace: true })
    pendingImport = null
    notify('Backup restaurado neste dispositivo.')
    await render()
  } else if (action.name === 'cancel-import') {
    pendingImport = null
    notify('Restauração cancelada. Os dados atuais foram mantidos.')
    await render()
  } else if (action.name === 'install-app') {
    if (!installEvent) return
    installEvent.prompt()
    await installEvent.userChoice
    installEvent = null
    await render()
  } else if (action.name === 'add-template-section' || action.name === 'add-template-item' || action.name === 'remove-template-item') {
    editTemplateDraft(action)
    await render()
  }
}

async function onSubmit(form, submitter) {
  const data = Object.fromEntries(new FormData(form).entries())
  const kind = form.dataset.form
  if (kind === 'machine') {
    const saved = await repository.saveMachine({ ...data, id: form.dataset.id || undefined })
    notify('Máquina salva.')
    await go(`#/maquinas/${saved.id}`)
  } else if (kind === 'component') {
    const saved = await repository.saveComponent({ ...data, id: form.dataset.id || undefined })
    notify('Componente salvo.')
    await go(`#/maquinas/${saved.machineId}`)
  } else if (kind === 'association') {
    await repository.changeAssociation({ tractorId: data.tractorId, implementId: data.implementId })
    notify('Associação atualizada. O histórico anterior foi mantido.')
    await render()
  } else if (kind === 'inspection') {
    const scope = data.scope
    const targetId = scope === 'componente' ? data.componentTarget : data.machineTarget
    if (!targetId || !data.templateId) throw new Error('Selecione o registro e o modelo do checklist.')
    const target = scope === 'componente'
      ? snapshot.components.find((item) => item.id === targetId)
      : snapshot.machines.find((item) => item.id === targetId)
    const machineId = scope === 'componente' ? target?.machineId : targetId
    const openAssociation = snapshot.associations.find((item) => item.endedAt == null && (item.tractorId === machineId || item.implementId === machineId))
    const existing = snapshot.inspections.find((item) => item.status === 'em_andamento' && item.scope === scope && item.targetId === targetId && item.templateId === data.templateId)
    const inspection = existing || await repository.startInspection({
      scope,
      targetId,
      machineId,
      templateId: data.templateId,
      responsible: data.responsible,
      date: data.date,
      contextImplementId: openAssociation?.implementId || ''
    })
    if (existing) notify('Há uma inspeção em andamento deste modelo. Ela foi reaberta.')
    await go(`#/checklists/${inspection.id}`)
  } else if (kind === 'test') {
    const saved = await repository.saveTest({ ...data, id: form.dataset.id || undefined, componentId: data.componentId || '' })
    notify('Teste operacional salvo.')
    await go(`#/testes/${saved.id}`)
  } else if (kind === 'photo') {
    const file = firstImage(form)
    const components = snapshot.components
    const link = validatePhotoLink({ machineId: data.machineId, componentId: data.componentId || '', components })
    if (!link.ok) throw new Error(link.error)
    const saved = await repository.savePhoto({
      machineId: data.machineId,
      componentId: data.componentId || '',
      inspectionId: data.inspectionId || '',
      itemId: data.itemId || '',
      testId: data.testId || '',
      description: data.description || '',
      capturedAt: data.capturedAt ? new Date(data.capturedAt).toISOString() : new Date().toISOString(),
      fileName: file.name,
      mimeType: file.type,
      blob: file
    })
    notify('Fotografia salva neste dispositivo.')
    await go(`#/fotos/${saved.id}`)
  } else if (kind === 'photo-filter') {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(data)) if (value) params.set(key, value)
    await go(`#/fotos?${params.toString()}`)
  } else if (kind === 'report') {
    reportHeader = {
      ...defaultReportHeader(snapshot),
      ...data,
      includeArchived: form.querySelector('[name="includeArchived"]').checked
    }
    const report = prepareReport(snapshot, reportHeader)
    if (submitter === 'pdf') await downloadPdf(report)
    else if (submitter === 'print') {
      await render()
      window.print()
    } else {
      notify('Prévia atualizada.')
      await render()
    }
  } else if (kind === 'settings') {
    await repository.saveSettings(data)
    notify('Preferências salvas neste dispositivo.')
    await render()
  } else if (kind === 'category') {
    await repository.saveCategory(data)
    notify('Categoria adicionada.')
    await render()
  } else if (kind === 'template') {
    const draft = readTemplateDraft(form)
    const saved = await repository.saveTemplate(draft)
    templateDraft = null
    templateDraftHash = ''
    notify('Modelo de checklist salvo.')
    await go(`#/dados/modelos/${saved.id}`)
  }
}

async function onChange(input) {
  if (input?.dataset?.action === 'read-backup') {
    const file = input.files?.[0]
    if (!file) return
    try {
      const payload = JSON.parse(await file.text())
      validateBackup(payload)
      pendingImport = payload
      notify('Arquivo validado. A restauração só ocorre depois da confirmação.')
    } catch (error) {
      pendingImport = null
      const known = /backup|fotografia|duplicad|identificador|versão/i.test(error.message || '')
      throw new Error(known ? error.message : 'O arquivo não é um backup válido do Checklist.')
    }
    await render()
    return
  }
  if (input.dataset.action === 'filter-components') {
    const form = input.form
    const select = form.querySelector('[name="componentId"]')
    if (!select) return
    const current = select.value
    const components = snapshot.components.filter((component) => !component.archived && (!input.value || component.machineId === input.value))
    select.replaceChildren(option('', 'Nenhum'), ...components.map((component) => option(component.id, component.name)))
    if (components.some((component) => component.id === current)) select.value = current
  }
  if (input.dataset.action === 'sync-inspection-form') {
    syncInspectionForm(input.form, snapshot)
  }
  if (input.form) syncReveals(input.form)
  if (input.form?.dataset.form === 'report' && input.dataset.submit) reportSubmit = input.dataset.submit
}

function onInput(event) {
  const input = event.target
  if (input.name !== 'busca') return
  const term = input.value.trim().toLowerCase()
  root.querySelectorAll('[data-search]').forEach((card) => {
    card.hidden = term.length > 0 && !card.dataset.search.includes(term)
  })
}

function editTemplateDraft(action) {
  const form = root.querySelector('[data-form="template"]')
  templateDraft = readTemplateDraft(form)
  if (action.name === 'add-template-section') {
    templateDraft.sections.push({ id: crypto.randomUUID(), title: '', items: [{ id: crypto.randomUUID(), label: '' }] })
  }
  if (action.name === 'add-template-item') {
    const section = templateDraft.sections.find((item) => item.id === action.section)
    section?.items.push({ id: crypto.randomUUID(), label: '' })
  }
  if (action.name === 'remove-template-item') {
    const section = templateDraft.sections.find((item) => item.id === action.section)
    if (!section) return
    section.items = section.items.filter((item) => item.id !== action.item)
    if (!section.items.length) section.items.push({ id: crypto.randomUUID(), label: '' })
  }
}

function readCard(card) {
  return {
    state: card.querySelector('[name="state"]').value,
    note: card.querySelector('[name="note"]').value,
    severity: card.querySelector('[name="severity"]').value,
    recommendedAction: card.querySelector('[name="recommendedAction"]').value,
    correctionOwner: card.querySelector('[name="correctionOwner"]').value,
    dueDate: card.querySelector('[name="dueDate"]').value,
    correctionStatus: card.querySelector('[name="correctionStatus"]').value
  }
}

function firstImage(form) {
  const camera = form.querySelector('[name="camera"]').files?.[0]
  const file = form.querySelector('[name="file"]').files?.[0]
  const chosen = (camera && camera.size) ? camera : file
  if (!chosen || !chosen.size) throw new Error('Selecione ou capture uma imagem.')
  if (!chosen.type.startsWith('image/')) throw new Error('O arquivo selecionado não é uma imagem.')
  return chosen
}

async function downloadBackup() {
  const backup = await repository.exportBackup()
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  downloadBlob(new Blob([JSON.stringify(backup)], { type: 'application/json' }), `checklist-backup-${stamp}.json`)
  notify('Backup exportado. Guarde o arquivo fora deste dispositivo.')
  await render()
}

async function downloadPdf(report) {
  const { renderPdf } = await import('../services/pdf.js')
  let logoBytes = null
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}logo.png`)
    if (response.ok) logoBytes = new Uint8Array(await response.arrayBuffer())
  } catch {
    logoBytes = null
  }
  const bytes = await renderPdf({ ...report, logoBytes })
  const stamp = (report.date || 'relatorio').replace(/[:.]/g, '-')
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `checklist-relatorio-${stamp}.pdf`)
  notify('PDF gerado neste dispositivo.')
  await render()
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function photoUrl(id) {
  const photo = snapshot.photos.find((item) => item.id === id)
  if (!photo?.blob || typeof URL.createObjectURL !== 'function') return ''
  const url = URL.createObjectURL(photo.blob)
  objectUrls.push(url)
  return url
}

function revokeUrls() {
  objectUrls.forEach((url) => URL.revokeObjectURL(url))
  objectUrls = []
}

function notify(text) {
  flash = { type: 'ok', text }
  flashFresh = true
}

async function showError(error) {
  flash = { type: 'erro', text: error?.message || 'Não foi possível concluir a operação.' }
  flashFresh = true
  if (repository && root) await render().catch(() => {})
}

async function go(hash) {
  if (location.hash !== hash) location.hash = hash
  await render()
}

async function refreshStorage() {
  try {
    if (navigator.storage?.estimate) storageEstimate = await navigator.storage.estimate()
  } catch {
    storageEstimate = null
  }
}

function blankTemplate() {
  return {
    name: '',
    scope: 'maquina',
    categoryId: '',
    sections: [{ id: crypto.randomUUID(), title: '', items: [{ id: crypto.randomUUID(), label: '' }] }]
  }
}

function option(value, label) {
  const node = document.createElement('option')
  node.value = value
  node.textContent = label
  return node
}

document.addEventListener('click', (event) => {
  const submitter = event.target.closest('button[type="submit"][data-submit]')
  if (submitter) reportSubmit = submitter.dataset.submit
})
