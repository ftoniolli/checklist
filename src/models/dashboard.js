import { listOpenNonconformities } from './checklist.js'

export function buildDashboard(data) {
  const machines = data.machines || []
  const components = data.components || []
  const inspections = data.inspections || []
  const tests = data.tests || []
  const activeMachines = machines.filter((machine) => machine.situation !== 'arquivada')
  const inspectedMachines = new Set()
  for (const inspection of inspections) {
    if (inspection.scope === 'maquina') inspectedMachines.add(inspection.targetId)
    if (inspection.machineId) inspectedMachines.add(inspection.machineId)
  }
  const inProgress = inspections.filter((inspection) => inspection.status === 'em_andamento')
  const withoutInspection = activeMachines.filter((machine) => !inspectedMachines.has(machine.id))

  return {
    machines: activeMachines.length,
    components: components.filter((component) => !component.archived).length,
    pendingInspections: inProgress.length + withoutInspection.length,
    completedInspections: inspections.filter((inspection) => inspection.status === 'concluida').length,
    openNonconformities: listOpenNonconformities(inspections, data.templates || []).length,
    operationalTests: tests.filter((test) => test.result !== 'nao_realizado').length,
    activities: [...(data.activities || [])].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 8)
  }
}
