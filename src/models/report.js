import { approvalOfMachine, inspectionSummary, latestInspections } from './checklist.js'

export function buildReport(header, data) {
  const from = header.from || ''
  const to = header.to || ''
  const machines = (data.machines || []).filter((machine) => {
    if (header.machineId && machine.id !== header.machineId) return false
    if (header.categoryId && machine.categoryId !== header.categoryId) return false
    if ((from || to) && !machineIntersectsPeriod(machine, data, from, to)) return false
    return true
  })

  return {
    organizationName: header.organizationName || 'ASCAD Agrotecnologia',
    propertyName: header.propertyName || '',
    workTitle: header.workTitle || '',
    date: header.date || '',
    responsibles: header.responsibles || '',
    technicalResponsible: header.technicalResponsible || '',
    conclusion: header.conclusion || '',
    generatedAt: header.generatedAt || '',
    machines: machines.map((machine) => {
      const components = (data.components || []).filter((component) => component.machineId === machine.id && !component.archived)
      const inspections = filterByPeriod(relevantInspections(machine, components, data.inspections || []), from, to, (item) => item.date || item.createdAt)
      const tests = filterByPeriod((data.tests || []).filter((test) => test.machineId === machine.id), from, to, (item) => item.datetime)
      const photos = filterByPeriod((data.photos || []).filter((photo) => photo.machineId === machine.id), from, to, (item) => item.capturedAt)
      const verdict = approvalOfMachine(
        machine.id,
        components.map((component) => component.id),
        periodApplies(from, to) ? inspections : relevantInspections(machine, components, data.inspections || []),
        data.templates || []
      )
      return {
        ...machine,
        categoryName: (data.categories || []).find((category) => category.id === machine.categoryId)?.name || '',
        components,
        inspections: inspections.map((inspection) => decorateInspection(inspection, data.templates || [])),
        tests,
        photos,
        verdict,
        openNonconformities: inspections.flatMap((inspection) => (
          decorateInspection(inspection, data.templates || []).summary.items.filter((item) => item.open)
        ))
      }
    })
  }
}

function decorateInspection(inspection, templates) {
  const template = templates.find((item) => item.id === inspection.templateId)
  return {
    ...inspection,
    templateName: template?.name || 'Checklist',
    summary: template ? inspectionSummary(template, inspection) : null
  }
}

function relevantInspections(machine, components, inspections) {
  const componentIds = new Set(components.map((component) => component.id))
  const related = inspections.filter((inspection) => (
    (inspection.scope === 'maquina' && inspection.targetId === machine.id)
    || (inspection.scope === 'componente' && componentIds.has(inspection.targetId))
    || inspection.machineId === machine.id
  ))
  return latestInspections(related)
}

function periodApplies(from, to) {
  return Boolean(from || to)
}

function machineIntersectsPeriod(machine, data, from, to) {
  const stamps = [machine.inspectionDate, machine.createdAt, machine.updatedAt]
  const related = [
    ...(data.inspections || []).filter((item) => item.machineId === machine.id || item.targetId === machine.id),
    ...(data.tests || []).filter((item) => item.machineId === machine.id),
    ...(data.photos || []).filter((item) => item.machineId === machine.id)
  ]
  for (const item of related) stamps.push(item.date, item.createdAt, item.datetime, item.capturedAt)
  return stamps.some((value) => inPeriod(value, from, to))
}

function filterByPeriod(records, from, to, pick) {
  if (!from && !to) return records
  return records.filter((record) => inPeriod(pick(record), from, to))
}

function inPeriod(value, from, to) {
  if (!value) return false
  const day = String(value).slice(0, 10)
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}
