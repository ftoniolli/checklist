export const ANSWER_STATES = ['nao_inspecionado', 'conforme', 'nao_conforme', 'nao_se_aplica']

const SEVERITIES = ['baixa', 'media', 'alta', 'critica']
const CORRECTIONS = ['aberta', 'em_correcao', 'concluida']

export function normalizeAnswer(patch = {}) {
  const state = ANSWER_STATES.includes(patch.state) ? patch.state : 'nao_inspecionado'
  const nonCompliant = state === 'nao_conforme'
  return {
    state,
    note: String(patch.note ?? '').trim(),
    photoIds: Array.isArray(patch.photoIds) ? [...patch.photoIds] : [],
    severity: nonCompliant ? (SEVERITIES.includes(patch.severity) ? patch.severity : 'media') : '',
    recommendedAction: nonCompliant ? String(patch.recommendedAction ?? '').trim() : '',
    correctionOwner: nonCompliant ? String(patch.correctionOwner ?? '').trim() : '',
    dueDate: nonCompliant ? String(patch.dueDate ?? '').trim() : '',
    correctionStatus: nonCompliant
      ? (CORRECTIONS.includes(patch.correctionStatus) ? patch.correctionStatus : 'aberta')
      : ''
  }
}

export function inspectionSummary(template, inspection) {
  const answers = inspection?.answers || {}
  const items = []
  let uninspected = 0
  let compliant = 0
  let nonCompliant = 0
  let notApplicable = 0
  let openNonconformities = 0

  for (const section of template?.sections || []) {
    for (const item of section.items) {
      const stored = answers[item.id]
      const answer = stored ? normalizeAnswer(stored) : normalizeAnswer({ state: 'nao_inspecionado' })
      if (answer.state === 'nao_inspecionado') uninspected += 1
      if (answer.state === 'conforme') compliant += 1
      if (answer.state === 'nao_conforme') nonCompliant += 1
      if (answer.state === 'nao_se_aplica') notApplicable += 1
      const open = answer.state === 'nao_conforme' && answer.correctionStatus !== 'concluida'
      if (open) openNonconformities += 1
      items.push({ ...item, section: section.title, ...answer, open })
    }
  }

  const total = items.length
  return {
    total,
    uninspected,
    compliant,
    nonCompliant,
    notApplicable,
    openNonconformities,
    items,
    approved: total > 0 && uninspected === 0 && openNonconformities === 0 && compliant > 0
  }
}

export function latestInspections(inspections) {
  const sorted = [...inspections].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
  const map = new Map()
  for (const inspection of sorted) {
    map.set(`${inspection.scope}:${inspection.targetId}:${inspection.templateId}`, inspection)
  }
  return [...map.values()]
}

export function listOpenNonconformities(inspections, templates = []) {
  const found = []
  for (const inspection of inspections || []) {
    const template = templates.find((item) => item.id === inspection.templateId)
    const labels = new Map()
    for (const section of template?.sections || []) {
      for (const item of section.items) labels.set(item.id, { label: item.label, section: section.title })
    }
    for (const [itemId, stored] of Object.entries(inspection.answers || {})) {
      const answer = normalizeAnswer(stored)
      if (answer.state !== 'nao_conforme' || answer.correctionStatus === 'concluida') continue
      const meta = labels.get(itemId)
      found.push({
        inspectionId: inspection.id,
        itemId,
        label: meta?.label || 'Item do checklist',
        section: meta?.section || '',
        scope: inspection.scope,
        targetId: inspection.targetId,
        machineId: inspection.machineId,
        templateId: inspection.templateId,
        templateName: template?.name || 'Checklist',
        ...answer
      })
    }
  }
  return found
}

export function approvalOfMachine(machineId, componentIds, inspections, templates) {
  const latest = latestInspections(inspections)
  const machineInspections = latest.filter((item) => item.scope === 'maquina' && item.targetId === machineId)
  const componentInspections = latest.filter((item) => item.scope === 'componente' && componentIds.includes(item.targetId))
  const reasons = []
  let correctedNonconformity = false

  if (!machineInspections.some((item) => item.status === 'concluida')) {
    reasons.push('Não há inspeção concluída da máquina.')
  }

  for (const inspection of [...machineInspections, ...componentInspections]) {
    const template = templates.find((item) => item.id === inspection.templateId)
    if (!template) {
      reasons.push('Modelo de checklist não encontrado.')
      continue
    }
    const summary = inspectionSummary(template, inspection)
    if (summary.uninspected > 0) reasons.push(`Há itens não inspecionados em "${template.name}".`)
    if (summary.openNonconformities > 0) reasons.push(`Há não conformidades abertas em "${template.name}".`)
    if (inspection.status !== 'concluida') reasons.push(`A inspeção "${template.name}" não foi concluída.`)
    if (summary.nonCompliant > 0 && summary.openNonconformities === 0) correctedNonconformity = true
  }

  const unique = [...new Set(reasons)]
  if (unique.length > 0) {
    return { approved: false, classification: 'Não aprovada', reasons: unique }
  }
  if (correctedNonconformity) {
    return { approved: true, classification: 'Aprovada com ressalvas', reasons: ['Há não conformidade já encerrada.'] }
  }
  return { approved: true, classification: 'Aprovada', reasons: [] }
}
