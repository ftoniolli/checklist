export function validateTemplate(input) {
  const name = String(input.name ?? '').trim()
  if (!name) return { ok: false, error: 'Informe o nome do modelo.' }
  if (!['maquina', 'componente', 'ambos'].includes(input.scope)) {
    return { ok: false, error: 'Informe se o modelo vale para máquina, componente ou ambos.' }
  }
  const sections = input.sections || []
  if (!sections.length) return { ok: false, error: 'Inclua ao menos uma seção.' }
  for (const section of sections) {
    if (!String(section.title ?? '').trim()) return { ok: false, error: 'Toda seção precisa de título.' }
    if (!section.items?.length) return { ok: false, error: 'Toda seção precisa de ao menos um item.' }
    for (const item of section.items) {
      if (!String(item.label ?? '').trim()) return { ok: false, error: 'Todo item precisa de texto.' }
    }
  }
  return {
    ok: true,
    value: {
      name,
      scope: input.scope,
      categoryId: String(input.categoryId ?? '').trim(),
      sections: sections.map((section) => ({
        id: section.id,
        title: String(section.title).trim(),
        items: section.items.map((item) => ({ id: item.id, label: String(item.label).trim() }))
      }))
    }
  }
}

export function parseTemplateText(name, scope, categoryId, text) {
  const sections = []
  let current = null
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('#') || line.startsWith('##')) {
      current = { id: crypto.randomUUID(), title: line.replace(/^#+\s*/, ''), items: [] }
      sections.push(current)
      continue
    }
    if (!current) {
      current = { id: crypto.randomUUID(), title: 'Geral', items: [] }
      sections.push(current)
    }
    current.items.push({ id: crypto.randomUUID(), label: line })
  }
  return validateTemplate({ name, scope, categoryId, sections })
}
