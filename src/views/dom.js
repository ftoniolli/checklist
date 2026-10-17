export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue
    if (key === 'class') node.className = value
    else if (key === 'value') node.value = value
    else if (key === 'checked') node.checked = value
    else if (key === 'selected') node.selected = value
    else node.setAttribute(key, value === true ? '' : String(value))
  }
  for (const child of children.flat()) append(node, child)
  return node
}

function append(node, child) {
  if (child == null || child === false) return
  if (Array.isArray(child)) {
    child.forEach((item) => append(node, item))
    return
  }
  node.append(child instanceof Node ? child : document.createTextNode(String(child)))
}

export function field(label, control, hint) {
  return h('label', { class: 'field' },
    h('span', {}, label),
    control,
    hint ? h('small', {}, hint) : null
  )
}

export function input(name, value, options = {}) {
  return h('input', {
    name,
    id: options.id,
    value: value ?? '',
    type: options.type || 'text',
    required: options.required,
    placeholder: options.placeholder,
    inputmode: options.inputmode,
    min: options.min,
    max: options.max,
    step: options.step,
    accept: options.accept,
    capture: options.capture
  })
}

export function area(name, value) {
  return h('textarea', { name, rows: '4', value: value ?? '' })
}

export function select(name, options, selected, config = {}) {
  const node = h('select', { name, required: config.required, 'data-action': config.action })
  if (config.placeholder != null) node.append(h('option', { value: '' }, config.placeholder))
  for (const option of options) {
    const item = h('option', { value: option.value }, option.label)
    if (String(option.value) === String(selected ?? '')) item.selected = true
    node.append(item)
  }
  return node
}

export function button(label, attrs = {}) {
  return h('button', { type: 'button', class: 'button', ...attrs }, label)
}

export function linkButton(label, href, className = 'button') {
  return h('a', { href, class: className }, label)
}

export function empty(text) {
  return h('p', { class: 'empty' }, text)
}

export function facts(pairs) {
  return h('dl', { class: 'facts' }, pairs.flatMap(([label, value]) => [
    h('dt', {}, label),
    h('dd', {}, value || '—')
  ]))
}

export function optionsOf(records, labelOf, valueOf = (record) => record.id) {
  return records.map((record) => ({ value: valueOf(record), label: labelOf(record) }))
}
