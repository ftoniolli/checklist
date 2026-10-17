export function changeAssociation(associations, { tractorId, implementId, now, id }) {
  if (!tractorId || !implementId) {
    throw new Error('Informe o trator e a plantadeira.')
  }
  if (tractorId === implementId) {
    throw new Error('Uma máquina não pode ser associada a ela mesma.')
  }

  const alreadyOpen = associations.find((item) => (
    item.tractorId === tractorId && item.implementId === implementId && item.endedAt === null
  ))
  if (alreadyOpen) return { associations, created: null, closed: [] }

  const closed = []
  const next = associations.map((item) => {
    const conflicts = item.endedAt === null && (item.implementId === implementId || item.tractorId === tractorId)
    if (!conflicts) return item
    const updated = { ...item, endedAt: now }
    closed.push(updated)
    return updated
  })
  const created = { id, tractorId, implementId, startedAt: now, endedAt: null }
  return { associations: [...next, created], created, closed }
}
