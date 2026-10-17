export function validatePhotoLink({ machineId, componentId, components }) {
  if (!machineId) return { ok: false, error: 'Selecione a máquina.' }
  if (componentId) {
    const component = (components || []).find((item) => item.id === componentId)
    if (!component || component.machineId !== machineId) {
      return { ok: false, error: 'O componente selecionado não pertence à máquina.' }
    }
  }
  return { ok: true }
}
